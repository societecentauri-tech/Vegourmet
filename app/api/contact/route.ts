// ─────────────────────────────────────────────────────────────────────────────
// /api/contact  (BFF — route serveur uniquement, JAMAIS d'accès navigateur direct)
//
// POST { name, email, subject, message, _hp?, _t? }
//      Valide le payload côté serveur, vérifie le honeypot anti-spam,
//      applique un rate-limit basique par IP, puis envoie l'e-mail via Resend.
//
// Variables d'environnement requises :
//   RESEND_API_KEY  — clé secrète Resend (path Infisical : /apps/vegourmet-prod)
//   CONTACT_TO      — adresse de réception (défaut : contact@vegourmet.fr)
//   CONTACT_FROM    — adresse expéditrice vérifiée Resend (défaut : contact@vegourmet.fr)
//                     ⚠️ DOIT être sur un domaine vérifié dans Resend.
//                     Tant que vegourmet.fr n'est pas vérifié, utiliser un domaine
//                     Centauri déjà vérifié ou « onboarding@resend.dev » (démo seulement).
//
// Réponses : 200 OK | 400 payload invalide | 200 silencieux (honeypot/bot) | 429 rate-limit | 503 config manquante | 500 erreur interne
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Validation e-mail robuste (pas de regex exotique).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Liste blanche des sujets autorisés (doit correspondre à ContactForm.tsx SUBJECTS).
const ALLOWED_SUBJECTS = new Set([
  "Question sur une recette",
  "Suggestion de recette",
  "Partenariat ou collaboration",
  "Problème technique",
  "Autre",
]);

/** Durée minimale de saisie (ms) sous laquelle on considère le message comme du spam. */
const MIN_FILL_MS = 3_000;

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY manquant — configurer dans l'env Vercel.");
  }
  return new Resend(key);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Rate-limit : 3 envois par IP par 10 minutes ──────────────────────────
  const ip = clientIp(req);
  const rl = rateLimit(`contact:post:${ip}`, 3, 600_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans quelques minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // ── Parse du body ─────────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  // ── Honeypot ──────────────────────────────────────────────────────────────
  const honeypot = typeof body._hp === "string" ? body._hp : "";
  if (honeypot.trim() !== "") {
    // Retourner 200 pour ne pas aider le bot à comprendre qu'il est détecté.
    return NextResponse.json({ ok: true });
  }

  // ── Délai minimal anti-bot ────────────────────────────────────────────────
  // `_t` est le timestamp de mount du formulaire côté client.
  // Si absent ou invalide (appel curl/test sans formulaire), on saute la vérification
  // plutôt que de silencer d'office — un humain légitime avec JS désactivé ou un
  // outil de test ne doit pas être bloqué silencieusement.
  const startTime =
    typeof body._t === "number" && body._t > 0 && body._t < Date.now()
      ? body._t
      : null;
  if (startTime !== null && Date.now() - startTime < MIN_FILL_MS) {
    // Soumission trop rapide : bot probable, silencer sans révéler la détection.
    return NextResponse.json({ ok: true });
  }

  // ── Validation des champs ─────────────────────────────────────────────────
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject =
    typeof body.subject === "string" ? body.subject.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Nom invalide (1–100 caractères)." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }
  if (!ALLOWED_SUBJECTS.has(subject)) {
    return NextResponse.json(
      { error: "Sujet non reconnu." },
      { status: 400 },
    );
  }
  if (!message || message.length < 10 || message.length > 3000) {
    return NextResponse.json(
      { error: "Message invalide (10–3000 caractères)." },
      { status: 400 },
    );
  }

  // ── Envoi via Resend ──────────────────────────────────────────────────────
  const to = process.env.CONTACT_TO ?? "contact@vegourmet.fr";
  const from =
    process.env.CONTACT_FROM ??
    // ⚠️ Domaine de fallback : tant que vegourmet.fr n'est pas vérifié dans
    // Resend (voir DETTE.md§contact-resend), utiliser un expéditeur Centauri
    // vérifié ou « onboarding@resend.dev » (démo Resend, suffixe [Resend]).
    // À remplacer par « contact@vegourmet.fr » dès que le domaine est vérifié.
    "onboarding@resend.dev";

  // ── Clé Resend — vérification avant tentative d'envoi ────────────────────
  // Distinction explicite de l'erreur de configuration pour éviter le log trompeur
  // « unexpected error » et retourner un 503 plutôt qu'un 500.
  if (!process.env.RESEND_API_KEY) {
    console.error("/api/contact config error: RESEND_API_KEY manquant — configurer dans l'env Vercel (path Infisical : /apps/vegourmet-prod).");
    return NextResponse.json(
      { error: "Service non configuré." },
      { status: 503 },
    );
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Vegourmet Contact] ${subject}`,
      html: buildEmailHtml({ name, email, subject, message }),
      text: buildEmailText({ name, email, subject, message }),
    });

    if (error) {
      // Ne pas exposer le message Resend brut côté client (peut contenir des infos internes).
      console.error("/api/contact Resend error:", error.name, error.message);
      return NextResponse.json(
        { error: "Service d'envoi indisponible. Réessaie dans quelques instants." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log sans données sensibles (masque la clé si elle apparaissait dans le message).
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      "/api/contact unexpected error:",
      msg.replace(process.env.RESEND_API_KEY ?? "", "[REDACTED]"),
    );
    return NextResponse.json(
      { error: "Erreur interne. Réessaie dans quelques instants." },
      { status: 500 },
    );
  }
}

// ── Templates e-mail ──────────────────────────────────────────────────────────

interface EmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml({ name, email, subject, message }: EmailData): string {
  const msgHtml = escapeHtml(message).replace(/\n/g, "<br>");
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#d98e73;margin-top:0">Nouveau message — Vegourmet Contact</h2>
  <table style="border-collapse:collapse;width:100%">
    <tr>
      <td style="padding:8px 0;font-weight:bold;width:100px">Nom&nbsp;:</td>
      <td style="padding:8px 0">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:bold">E-mail&nbsp;:</td>
      <td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:bold">Sujet&nbsp;:</td>
      <td style="padding:8px 0">${escapeHtml(subject)}</td>
    </tr>
  </table>
  <hr style="border:none;border-top:1px solid #ece6df;margin:16px 0" />
  <p style="white-space:pre-wrap;line-height:1.7">${msgHtml}</p>
  <hr style="border:none;border-top:1px solid #ece6df;margin:16px 0" />
  <p style="color:#8c8c8c;font-size:0.8rem">
    Message reçu via le formulaire de contact vegourmet.fr
  </p>
</body>
</html>
`.trim();
}

function buildEmailText({ name, email, subject, message }: EmailData): string {
  return [
    "Nouveau message — Vegourmet Contact",
    "",
    `Nom : ${name}`,
    `E-mail : ${email}`,
    `Sujet : ${subject}`,
    "",
    "Message :",
    message,
    "",
    "---",
    "Message reçu via le formulaire de contact vegourmet.fr",
  ].join("\n");
}
