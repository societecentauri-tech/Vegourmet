// ─────────────────────────────────────────────────────────────────────────────
// POST /api/newsletter/unsubscribe
//
// One-click unsubscribe RFC 8058 (List-Unsubscribe: One-Click).
// Corps accepté :
//   - application/x-www-form-urlencoded : { email=..., List-Unsubscribe=One-Click }
//   - application/json                  : { email }
//
// Répond 200 sans redirect (exigence RFC 8058 §3).
//
// Standard BFF Centauri (bff-2026.md).
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { unsubscribeFromVegourmet } from "@/lib/listmonk";
import { validateUnsubscribeInput } from "@/lib/newsletter-validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function extractRawEmail(req: NextRequest): Promise<string | null> {
  const ct = req.headers.get("content-type") ?? "";

  // RFC 8058 one-click : x-www-form-urlencoded
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    return params.get("email") ?? null;
  }

  // JSON fallback (page /desabonnement ou appel direct)
  if (ct.includes("application/json")) {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return null;
    }
    if (raw && typeof raw === "object" && "email" in raw) {
      const val = (raw as Record<string, unknown>).email;
      return typeof val === "string" ? val : null;
    }
    return null;
  }

  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(`newsletter:unsubscribe:${ip}`, 10, 60_000);
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

  const rawEmail = await extractRawEmail(req);
  if (!rawEmail) {
    return NextResponse.json(
      { error: "Adresse e-mail manquante." },
      { status: 422 },
    );
  }

  const validation = validateUnsubscribeInput({ email: rawEmail });
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Adresse e-mail invalide." },
      { status: 422 },
    );
  }

  try {
    const result = await unsubscribeFromVegourmet(validation.email);

    if (!result.ok) {
      console.error(
        JSON.stringify({
          level: "error",
          action: "unsubscribe_route_error",
          error: result.error,
          timestamp: new Date().toISOString(),
        }),
      );
      return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
    }

    // RFC 8058 §3 : 200 sans redirect.
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        action: "unsubscribe_route_exception",
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      }),
    );
    return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
  }
}
