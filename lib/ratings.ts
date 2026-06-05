// ─────────────────────────────────────────────────────────────────────────────
// Lecture SSG des notes agrégées (snapshot build-time).
//
// `lib/ratings-snapshot.json` est généré au build par
// `scripts/fetch-ratings-snapshot.mjs` (fetch service_role de la vue
// `recipe_ratings`), puis consommé ici SYNCHRONEMENT — compatible
// `generateStaticParams` / rendu statique, sans fetch réseau par page.
//
// Le snapshot ne contient QUE les recettes avec `ratingCount > 0` (jamais de
// recette à 0 note → pas d'`aggregateRating` invalide → pas de manual action
// Google). Une recette absente du snapshot = pas de note.
// ─────────────────────────────────────────────────────────────────────────────

import snapshot from "./ratings-snapshot.json";

export interface RecipeRating {
  ratingValue: number;
  ratingCount: number;
  reviewCount: number;
}

const RATINGS = snapshot as Record<string, RecipeRating>;

/** Note agrégée d'une recette (snapshot build-time), ou `null` si non notée. */
export function getRecipeRating(slug: string): RecipeRating | null {
  const r = RATINGS[slug];
  if (!r || r.ratingCount <= 0) return null;
  return r;
}

/** Toutes les notes (lecture seule). */
export function getAllRatings(): Record<string, RecipeRating> {
  return RATINGS;
}
