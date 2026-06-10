// ─────────────────────────────────────────────────────────────────────────────
// /api/download?token=<uuid>
//
// Lien cliqué depuis l'email envoyé par n8n. La validation du token (existence,
// non consommé) est faite côté n8n via UPDATE conditionnel sur
// `media_downloads.downloaded_at` (idempotent via COALESCE : un même token peut
// être recliqué, le PDF est servi mais `downloaded_at` reste figé à la première
// consommation).
//
// Architecture (BFF, server-to-server) :
//   1. Validation UUID format côté Next.js (rejet précoce, anti-énumération).
//   2. Rate-limit : 10 req/min/IP.
//   3. Forward server-to-server au webhook n8n `download-ressource`.
//   4. n8n renvoie un 302 vers l'URL PDF Vegourmet → on relaie notre propre 302
//      avec allowlist du host (le browser ne voit jamais l'URL n8n).
//
// Référence : système LeadMagnet MCG (apps/web/src/app/api/download/route.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { allowedRedirectHost, isValidToken } from "@/lib/ressource-validation";

export const dynamic = "force-dynamic";

const N8N_DOWNLOAD_URL =
  "https://n8n.alpha.cntri.cloud/webhook/download-ressource";

/** Empreinte courte et non réversible de l'IP, pour les logs sans PII. */
function ipHash(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (Math.imul(31, h) + ip.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);

  // Rate-limit : 10 req / minute / IP (anti-énumération de token).
  const rl = rateLimit(`download:get:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    console.warn(JSON.stringify({ event: "download_rate_limited", ip_hash: ipHash(ip) }));
    return NextResponse.json(
      { error: "Trop de requêtes. Réessaie dans un moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const rawToken: string | null = req.nextUrl.searchParams.get("token");
  const tokenPrefix: string | null =
    typeof rawToken === "string" && rawToken.length > 0
      ? rawToken.slice(0, 8)
      : null;
  if (!isValidToken(rawToken)) {
    console.warn(
      JSON.stringify({
        event: "download_invalid_token",
        token_prefix: tokenPrefix,
        reason: "not_uuid",
      }),
    );
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }
  const token: string = rawToken;

  try {
    const n8nResponse = await fetch(`${N8N_DOWNLOAD_URL}?token=${token}`, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "X-Forwarded-For": ip,
        "User-Agent": req.headers.get("user-agent") ?? "unknown",
      },
    });

    if (n8nResponse.status === 302) {
      const location = n8nResponse.headers.get("location");
      if (location) {
        const host = allowedRedirectHost(location);
        if (!host) {
          console.error(
            JSON.stringify({ event: "download_redirect", outcome: "blocked_host" }),
          );
          return NextResponse.json(
            { error: "Cible de téléchargement invalide." },
            { status: 502 },
          );
        }
        console.log(
          JSON.stringify({ event: "download_redirect", slug: null, outcome: "redirect" }),
        );
        return NextResponse.redirect(location, 302);
      }
    }

    // n8n renvoie 404 HTML « lien invalide ou expiré » — on relaie tel quel.
    const body = await n8nResponse.text();
    console.log(
      JSON.stringify({ event: "download_redirect", slug: null, outcome: `n8n_${n8nResponse.status}` }),
    );
    return new NextResponse(body, {
      status: n8nResponse.status,
      headers: {
        "Content-Type":
          n8nResponse.headers.get("Content-Type") ?? "text/html; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    console.error(
      JSON.stringify({
        event: "download_redirect",
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
