// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès serveur (BFF) à la table newsletter_subscribers de vegourmet_prod.
//
// server-only : utilise la clé service_role Supabase. Ne JAMAIS importer côté
// client. Tout passe par la route API `app/api/newsletter` (standard BFF Centauri).
// PostgREST derrière Kong : header `apikey` OBLIGATOIRE + `Authorization: Bearer`.
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";
import { COMMENTS_API_URL } from "./comments-backend";

/** Texte de consentement canonique (preuve RGPD, défini côté serveur). */
export const NEWSLETTER_CONSENT_TEXT =
  "J'accepte de recevoir la newsletter de Vegourmet (recettes, conseils et offres) " +
  "et que mon adresse e-mail soit utilisée à cette fin. Désinscription possible à tout moment.";

function serviceKey(): string {
  const raw =
    process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) {
    throw new Error(
      "SUPABASE_SERVICE_KEY manquant : inscription newsletter impossible.",
    );
  }
  return raw.trim();
}

function authHeaders(): Record<string, string> {
  const key = serviceKey();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export interface NewsletterInput {
  email: string;
  firstName?: string;
  source?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

/**
 * Inscrit une adresse à la newsletter (single opt-in avec consentement explicite).
 * Idempotent : une adresse déjà présente renvoie `alreadySubscribed: true`.
 */
export async function subscribeToNewsletter(
  input: NewsletterInput,
): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  const body = {
    email,
    first_name: input.firstName?.trim() || null,
    consent: true,
    consent_text: NEWSLETTER_CONSENT_TEXT,
    source: input.source?.trim() || "homepage",
    ip_address: input.ip || null,
    user_agent: input.userAgent || null,
    status: "subscribed",
  };

  const res = await fetch(`${COMMENTS_API_URL}/rest/v1/newsletter_subscribers`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 201) {
    // Notification best-effort : si elle échoue, l'inscription reste un succès.
    void notifyNewSubscriber(email);
    return { ok: true, alreadySubscribed: false };
  }

  // 409 = violation d'unicité (lower(email)) → déjà inscrit·e (idempotent).
  if (res.status === 409) {
    return { ok: true, alreadySubscribed: true };
  }

  const detail = await res.text().catch(() => "");
  return {
    ok: false,
    error: `Inscription refusée (HTTP ${res.status}) ${detail}`.trim(),
  };
}

// ── Notification interne — nouvel inscrit newsletter ─────────────────────────

/**
 * Envoie un e-mail d'alerte à contact@vegourmet.fr lors d'une nouvelle inscription.
 * Best-effort : toute erreur est loggée mais N'EST PAS propagée à l'appelant.
 * Réutilise RESEND_API_KEY + CONTACT_FROM identiques à /api/contact.
 */
async function notifyNewSubscriber(subscriberEmail: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Clé absente → notification impossible, inscription déjà confirmée.
    console.warn("[newsletter-backend] RESEND_API_KEY absent — notification inscrit non envoyée.");
    return;
  }

  const to = process.env.CONTACT_TO ?? "contact@vegourmet.fr";
  const from = process.env.CONTACT_FROM ?? "onboarding@resend.dev";
  const now = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `[Vegourmet] Nouvel inscrit newsletter`,
      text: [
        "Nouvel inscrit newsletter — Vegourmet",
        "",
        `E-mail : ${subscriberEmail}`,
        `Date   : ${now}`,
        "",
        "---",
        "Alerte automatique vegourmet.fr",
      ].join("\n"),
      html: `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="color:#d98e73;margin-top:0">Nouvel inscrit newsletter</h2>
  <p><strong>E-mail :</strong> ${subscriberEmail}</p>
  <p><strong>Date :</strong> ${now}</p>
  <hr style="border:none;border-top:1px solid #ece6df;margin:16px 0"/>
  <p style="color:#8c8c8c;font-size:0.8rem">Alerte automatique vegourmet.fr</p>
</body></html>`.trim(),
    });

    if (error) {
      console.error("[newsletter-backend] Notification inscrit — Resend error:", error.name, error.message);
    }
  } catch (err) {
    console.error("[newsletter-backend] Notification inscrit — erreur inattendue:", err instanceof Error ? err.message : String(err));
  }
}
