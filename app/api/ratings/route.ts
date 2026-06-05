// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ratings?slug=<recipe_slug>
//
// Route BFF (server-only, service_role) : lit la vue `recipe_ratings` et renvoie
// la note agrégée d'une recette. Aucun accès client direct à PostgREST.
// Réponse : { ratingValue, ratingCount, reviewCount } ou 404 si non notée.
// ─────────────────────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { fetchRecipeRating } from "@/lib/comments-backend";
import { sanitizeText } from "@/lib/comment-validation";

// Toujours dynamique : on lit la note fraîche en base à la demande.
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Paramètre `slug` invalide ou manquant." },
      { status: 400 },
    );
  }

  try {
    const rating = await fetchRecipeRating(slug);
    if (!rating) {
      return NextResponse.json(
        { error: "Recette non notée." },
        { status: 404 },
      );
    }
    return NextResponse.json(rating, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (err) {
    // On ne fuit jamais le détail interne (pas de stack trace exposée).
    console.error(`/api/ratings slug=${sanitizeText(slug)} :`, err);
    return NextResponse.json(
      { error: "Service indisponible." },
      { status: 502 },
    );
  }
}
