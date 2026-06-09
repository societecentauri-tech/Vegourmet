import { slugifyTaxo } from "./slug";

/**
 * Style de catégorie du thème « Yummy Bites » + WP Delicious.
 *
 * Sur la carte partagée, chaque contenu porte une pastille ronde colorée avec
 * une icône blanche au centre (cf. .reference/html/listing.html / home.html :
 * span.dr-category > a > svg.svg-icon). Le mapping ci-dessous associe chaque
 * catégorie éditoriale vegourmet.fr à sa couleur et à un glyphe.
 *
 * Couleurs attestées dans le rendu réel (var --yummy-category-color et fills
 * des cercles SVG) : Plat Vegan #8a5a44, Apéro Vegan #d96f54,
 * Actualités/Inspiration #6d9f8b, pastilles thématiques gold #e6b170.
 * Les catégories sans couleur attestée sont dérivées de la palette du thème
 * (famille terracotta / pêche / or / olive).
 */

/** Glyphe blanc affiché au centre de la pastille catégorie. */
export type CategoryGlyph =
  | "plate"
  | "drink"
  | "cake"
  | "coffee"
  | "snack"
  | "leaf";

interface CategoryStyle {
  color: string;
  glyph: CategoryGlyph;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // Catégories de recette (recipe-course) — couleurs attestées.
  "plat-vegan": { color: "#8a5a44", glyph: "plate" },
  "apero-vegan": { color: "#d96f54", glyph: "drink" },
  // Couleurs dérivées de la palette du thème.
  "dessert-vegan": { color: "#d98e73", glyph: "cake" },
  "petit-dejeuner-vegan": { color: "#e6b170", glyph: "coffee" },
  "snack-vegan": { color: "#ee9060", glyph: "snack" },
  // Catégories de blog.
  "actualites-tendances": { color: "#6d9f8b", glyph: "leaf" },
  "actualites-et-tendances": { color: "#6d9f8b", glyph: "leaf" },
  "inspiration-et-lifestyle": { color: "#6d9f8b", glyph: "leaf" },
  "conseils-et-astuces": { color: "#d98e73", glyph: "leaf" },
  "guides-pratiques": { color: "#8a5a44", glyph: "leaf" },
  "le-blog": { color: "#8a5a44", glyph: "leaf" },
};

const FALLBACK: CategoryStyle = { color: "#8a5a44", glyph: "leaf" };

/** Style complet (couleur + glyphe) de la pastille pour une catégorie. */
export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[slugifyTaxo(category)] ?? FALLBACK;
}

/** Couleur de pastille catégorie. */
export function getCategoryColor(category: string): string {
  return getCategoryStyle(category).color;
}

/** Slug de catégorie pour construire l'URL /category/<slug>. */
export function getCategoryHref(category: string): string {
  return `/category/${slugifyTaxo(category)}/`;
}
