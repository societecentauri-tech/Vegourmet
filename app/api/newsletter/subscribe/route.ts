// ─────────────────────────────────────────────────────────────────────────────
// POST /api/newsletter/subscribe
//
// Corps JSON : { email, firstName?, consentWording, source? }
//
// Inscrit l'email à la liste vegourmet dans Listmonk avec statut `unconfirmed`.
// Listmonk envoie l'e-mail de double opt-in (template id 5 — veg-double-optin).
// Idempotent : adresse déjà inscrite → 202 { alreadySubscribed: true }.
//
// Standard BFF Centauri (bff-2026.md) : aucun appel direct client → Listmonk.
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { subscribeToVegourmet } from "@/lib/listmonk";
import { validateSubscribeInput } from "@/lib/newsletter-validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(`newsletter:subscribe:${ip}`, 5, 60_000);
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const validation = validateSubscribeInput(raw);
  if (!validation.ok) {
    const messages: Record<string, string> = {
      email_invalid: "Adresse e-mail invalide.",
      email_too_long: "Adresse e-mail trop longue (max 254 caractères).",
      consent_missing: "Le libellé de consentement est requis.",
      first_name_too_long: "Prénom trop long (max 80 caractères).",
      source_too_long: "Source trop longue (max 80 caractères).",
    };
    return NextResponse.json(
      { error: messages[validation.reason] ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { email, firstName, consentWording, source } = validation.data;

  try {
    const result = await subscribeToVegourmet({
      email,
      firstName,
      consentWording,
      source,
    });

    if (!result.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          action: "subscribe_route_error",
          error: result.error,
          timestamp: new Date().toISOString(),
        }),
      );
      return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
    }

    return NextResponse.json(
      { ok: true, alreadySubscribed: result.alreadySubscribed },
      { status: 202 },
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        action: "subscribe_route_exception",
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      }),
    );
    return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
  }
}
