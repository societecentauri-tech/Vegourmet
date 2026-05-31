import { getAllArticles, getAllRecipes } from "./content";
import type { ArticleFrontmatter, RecipeFrontmatter } from "./types";
import { TAXO_LABELS, taxoSlugs } from "./taxonomy-data";

export type TaxoKind =
  | "recette-type"
  | "recette-style"
  | "recette-thematique"
  | "category";

const TAXO_TITLES: Record<TaxoKind, string> = {
  "recette-type": "Type de recette",
  "recette-style": "Style de cuisine",
  "recette-thematique": "Thématique",
  category: "Catégorie",
};

export function getTaxoTitle(kind: TaxoKind): string {
  return TAXO_TITLES[kind];
}

/** Slugs réels d'une taxonomie (parité d'URL avec vegourmet.fr). */
export { taxoSlugs };

/**
 * Recettes appartenant à une taxonomie, par appartenance EXPLICITE
 * (champ `taxonomies` du frontmatter, source = archives vegourmet.fr).
 * Le type « category » ne concerne que les articles → liste vide ici.
 */
export function getRecipesForTaxo(
  kind: TaxoKind,
  slug: string,
): RecipeFrontmatter[] {
  if (kind === "category") return [];
  return getAllRecipes()
    .map((r) => r.frontmatter)
    .filter((r) => (r.taxonomies?.[kind] ?? []).includes(slug));
}

/** Articles d'une catégorie (type « category » uniquement), par `categorySlug`. */
export function getArticlesForTaxo(
  kind: TaxoKind,
  slug: string,
): ArticleFrontmatter[] {
  if (kind !== "category") return [];
  return getAllArticles()
    .map((a) => a.frontmatter)
    .filter((a) => a.categorySlug === slug);
}

/** Libellé lisible d'une taxonomie à partir de son slug. */
export function resolveTaxoLabel(kind: TaxoKind, slug: string): string {
  const label = TAXO_LABELS[kind]?.[slug];
  if (label) return label;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
