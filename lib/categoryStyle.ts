import { slugifyTaxo } from "./content";

/**
 * Couleurs de catégorie du thème « Yummy Bites » (var --yummy-category-color
 * dans le HTML réel). Mapping fidèle aux catégories éditoriales vegourmet.fr.
 * Fallback sur la couleur « cat » de la palette si la catégorie est inconnue.
 */
const CATEGORY_COLORS: Record<string, string> = {
  "actualites-tendances": "#6d9f8b",
  "conseils-et-astuces": "#d98e73",
  "guides-pratiques": "#8a5a44",
  "inspiration-et-lifestyle": "#a3a96a",
  "le-blog": "#8a5a44",
  "dessert-vegan": "#d98e73",
  "plat-vegan": "#6d9f8b",
};

/** Couleur de pastille catégorie (CSS var --vg-cat-color injectée inline). */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[slugifyTaxo(category)] ?? "#8a5a44";
}

/** Slug de catégorie pour construire l'URL /category/<slug>. */
export function getCategoryHref(category: string): string {
  return `/category/${slugifyTaxo(category)}`;
}
