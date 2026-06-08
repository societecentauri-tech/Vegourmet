// ─────────────────────────────────────────────────────────────────────────────
// /api/comments
//
// GET  ?slug=<recipe_slug>&page=N
//      Liste paginée et THREADÉE des avis `approved` d'une recette : avis de
//      premier niveau (notés, created_at desc), chacun avec ses réponses
//      d'auteur (Chloé) imbriquées dans `replies[]`. La pagination et le `total`
//      portent sur les AVIS de premier niveau (pas le total à plat).
//      N'expose JAMAIS `author_email_hash`.
//
// POST { slug, authorName, rating(1-5), content }
//      Crée un avis en `status='pending'` (modération), `legacy_wp_id` NULL.
//      Validation stricte + sanitization + rate-limit basique.
//
// Route BFF (server-only, service_role) : aucun accès client direct à PostgREST.
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import {
  COMMENTS_PAGE_SIZE,
  fetchThreadedComments,
  insertPendingComment,
} from "@/lib/comments-backend";
import { validateNewComment } from "@/lib/comment-validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const slug = params.get("slug")?.trim() ?? "";
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Paramètre `slug` invalide ou manquant." },
      { status: 400 },
    );
  }

  const pageRaw = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  try {
    const result = await fetchThreadedComments(slug, page, COMMENTS_PAGE_SIZE);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=120" },
    });
  } catch (err) {
    console.error(`/api/comments GET slug=${slug} page=${page} :`, err);
    return NextResponse.json(
      { error: "Service indisponible." },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate-limit basique par IP : 5 soumissions / minute.
  const ip = clientIp(req);
  const rl = rateLimit(`comments:post:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de soumissions. Réessayez dans une minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps JSON invalide." },
      { status: 400 },
    );
  }

  const validation = validateNewComment(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const { id } = await insertPendingComment(validation.value);
    return NextResponse.json(
      {
        id,
        status: "pending",
        message:
          "Merci ! Ton avis a bien été reçu et sera publié après modération.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(`/api/comments POST slug=${validation.value.slug} :`, err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer ton avis pour le moment." },
      { status: 502 },
    );
  }
}
