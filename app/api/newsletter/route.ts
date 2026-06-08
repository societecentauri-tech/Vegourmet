// ─────────────────────────────────────────────────────────────────────────────
// /api/newsletter
//
// POST { email, firstName?, consent }
//      Inscrit une adresse à la newsletter (single opt-in, consentement explicite
//      requis). Stocke la preuve RGPD (texte de consentement, horodatage, IP, UA).
//      Idempotent : adresse déjà inscrite -> 200 { alreadySubscribed: true }.
//
// Route BFF (server-only, service_role) : aucun accès client direct à PostgREST.
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/newsletter-backend";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Validation e-mail volontairement simple et robuste (pas de regex exotique).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(`newsletter:post:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans une minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : undefined;
  const consent = body.consent === true;
  const source = typeof body.source === "string" ? body.source.trim() : "homepage";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }
  // RGPD : consentement explicite obligatoire.
  if (!consent) {
    return NextResponse.json(
      { error: "Le consentement est requis pour s'inscrire." },
      { status: 422 },
    );
  }
  if (firstName && firstName.length > 80) {
    return NextResponse.json(
      { error: "Prénom trop long." },
      { status: 400 },
    );
  }

  try {
    const result = await subscribeToNewsletter({
      email,
      firstName,
      source,
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    if (!result.ok) {
      console.error("/api/newsletter POST :", result.error);
      return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      alreadySubscribed: result.alreadySubscribed,
    });
  } catch (err) {
    console.error("/api/newsletter POST :", err);
    return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
  }
}
