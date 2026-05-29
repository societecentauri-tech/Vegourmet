import { getAllArticles, getAllRecipes, slugifyTaxo } from "./content";
import type { ArticleFrontmatter, RecipeFrontmatter } from "./types";

export type TaxoKind =
  | "recette-type"
  | "recette-style"
  | "recette-thematique"
  | "category";

export interface TaxoDefinition {
  kind: TaxoKind;
  label: string;
  /** Décrit la source de l'appariement pour ce type de taxonomie. */
  title: string;
}

const TAXO_TITLES: Record<TaxoKind, string> = {
  "recette-type": "Type de recette",
  "recette-style": "Style de cuisine",
  "recette-thematique": "Thématique",
  category: "Catégorie",
};

export function getTaxoTitle(kind: TaxoKind): string {
  return TAXO_TITLES[kind];
}

/**
 * Retourne les recettes correspondant à une valeur de taxonomie selon le type.
 * - recette-type : champ `category` de la recette
 * - recette-style : champ `cuisine`
 * - recette-thematique : un des `tags`
 * - category : `category` recette OU `category` article
 */
export function getRecipesForTaxo(
  kind: TaxoKind,
  slug: string,
): RecipeFrontmatter[] {
  const recipes = getAllRecipes().map((r) => r.frontmatter);

  switch (kind) {
    case "recette-type":
      return recipes.filter((r) => slugifyTaxo(r.category) === slug);
    case "recette-style":
      return recipes.filter((r) => slugifyTaxo(r.cuisine) === slug);
    case "recette-thematique":
      return recipes.filter((r) =>
        r.tags.some((tag) => slugifyTaxo(tag) === slug),
      );
    case "category":
      return recipes.filter((r) => slugifyTaxo(r.category) === slug);
    default:
      return [];
  }
}

/** Articles correspondant à une `category` (uniquement pour le type « category »). */
export function getArticlesForTaxo(
  kind: TaxoKind,
  slug: string,
): ArticleFrontmatter[] {
  if (kind !== "category") return [];
  return getAllArticles()
    .map((a) => a.frontmatter)
    .filter((a) => slugifyTaxo(a.category) === slug);
}

/** Libellé lisible d'une taxonomie à partir de son slug (premier match trouvé). */
export function resolveTaxoLabel(kind: TaxoKind, slug: string): string {
  const recipes = getAllRecipes().map((r) => r.frontmatter);
  for (const r of recipes) {
    if (kind === "recette-style" && slugifyTaxo(r.cuisine) === slug)
      return r.cuisine;
    if (
      (kind === "recette-type" || kind === "category") &&
      slugifyTaxo(r.category) === slug
    )
      return r.category;
    if (kind === "recette-thematique") {
      const tag = r.tags.find((t) => slugifyTaxo(t) === slug);
      if (tag) return tag;
    }
  }
  if (kind === "category") {
    const article = getAllArticles()
      .map((a) => a.frontmatter)
      .find((a) => slugifyTaxo(a.category) === slug);
    if (article) return article.category;
  }
  // Fallback : reconstruit un libellé lisible depuis le slug.
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
