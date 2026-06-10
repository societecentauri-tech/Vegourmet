// ─────────────────────────────────────────────────────────────────────────────
// /api/ressource
//
// POST { email, ressource_slug }
//      Initie une demande de téléchargement de lead-magnet (LeadMagnet).
//
// Architecture (BFF, server-to-server, jamais exposé au browser) :
//   1. Frontend POST { email, ressource_slug } (body JSON, pas de PII en query
//      string côté browser).
//   2. Validation pure (email + slug) via lib/ressource-validation.
//   3. Forward server-side au webhook n8n `get-ressource` avec `X-Webhook-Secret`.
//      n8n gère le lookup `media_ressources` (centauri_prod, multi-site par slug),
//      l'INSERT `media_downloads`, et l'envoi de l'email Resend contenant le lien
//      `/api/download?token=<uuid>`.
//   4. Rate-limit : 5 demandes/heure/IP (anti-spam email).
//
// La vérification d'existence du slug est déléguée à n8n (silent fail
// anti-énumération : si le slug n'existe pas, aucun email n'est envoyé).
//
// Référence : système LeadMagnet MCG (apps/web/src/app/api/ressource/route.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { validateRessourceRequest } from "@/lib/ressource-validation";

export const dynamic = "force-dynamic";

const N8N_WEBHOOK_URL = "https://n8n.alpha.cntri.cloud/webhook/get-ressource";

/** Empreinte courte et non réversible de l'IP, pour les logs sans PII. */
function ipHash(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);

  // Rate-limit : 5 demandes / heure / IP (anti-spam email).
  const rl = rateLimit(`ressource:post:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    console.warn(
      JSON.stringify({
        event: "ressource_rate_limited",
        slug: null,
        ip_hash: ipHash(ip),
      }),
    );
    return NextResponse.json(
      { error: "Trop de demandes. Réessaie dans une heure." },
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
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const validation = validateRessourceRequest(payload);
  if (!validation.ok) {
    console.warn(
      JSON.stringify({ event: "ressource_email_invalid", slug: null, reason: validation.reason }),
    );
    return NextResponse.json(
      { error: "Adresse e-mail ou ressource invalide." },
      { status: 400 },
    );
  }

  const { email, ressource_slug } = validation.value;

  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      JSON.stringify({ event: "ressource_request", slug: ressource_slug, outcome: "missing_secret" }),
    );
    return NextResponse.json(
      { error: "Service temporairement indisponible." },
      { status: 503 },
    );
  }

  try {
    // Le webhook n8n actuel lit `$json.query.email` (workflow get-ressource).
    // L'appel sort vers le réseau privé alpha — l'URL n'est jamais vue par le
    // browser. Le secret reste server-only.
    const params = new URLSearchParams({
      email,
      nom_ressource: ressource_slug,
    });

    const n8nResponse = await fetch(`${N8N_WEBHOOK_URL}?${params.toString()}`, {
      method: "GET",
      headers: { "X-Webhook-Secret": webhookSecret },
      signal: AbortSignal.timeout(8000),
    });

    if (!n8nResponse.ok) {
      console.error(
        JSON.stringify({ event: "ressource_request", slug: ressource_slug, outcome: "n8n_error" }),
      );
      return NextResponse.json(
        { error: "Service temporairement indisponible." },
        { status: 502 },
      );
    }

    console.log(
      JSON.stringify({ event: "ressource_request", slug: ressource_slug, outcome: "sent" }),
    );
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error(
      JSON.stringify({
        event: "ressource_request",
        slug: ressource_slug,
        outcome: "exception",
        message: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue." },
      { status: 500 },
    );
  }
}
