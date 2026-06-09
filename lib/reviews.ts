// ─────────────────────────────────────────────────────────────────────────────
// Lecture SSG des avis individuels (snapshot build-time).
//
// `lib/reviews-snapshot.json` est généré au build par
// `scripts/fetch-reviews-snapshot.mjs` (fetch service_role de `public.comments`),
// puis consommé ici SYNCHRONEMENT — compatible `generateStaticParams` /
// rendu statique, sans fetch réseau par page.
//
// Le snapshot ne contient QUE les avis avec `rating IS NOT NULL` et
// `status = 'approved'`. Une recette absente = pas d'avis → pas de `review`
// dans le JSON-LD (jamais d'invention).
// ─────────────────────────────────────────────────────────────────────────────

import snapshot from "./reviews-snapshot.json";

export interface RecipeReview {
  /** Prénom / pseudo de l'auteur de l'avis. */
  authorName: string;
  /** Corps de l'avis (texte libre). */
  content: string;
  /** Note sur 5 (1–5). */
  rating: number;
  /** Date de publication ISO YYYY-MM-DD. */
  datePublished: string;
}

const REVIEWS = snapshot as Record<string, RecipeReview[]>;

/**
 * Avis individuels d'une recette (snapshot build-time).
 * Retourne `[]` si la recette n'a aucun avis noté.
 */
export function getRecipeReviews(slug: string): RecipeReview[] {
  return REVIEWS[slug] ?? [];
}
