// Bloc « Produits sélectionnés par Chloé » par recette (snapshot build-time).
// Données scrapées depuis le WP via scripts/scrape-product-picks.py, images
// rapatriées sur S3. Consommé par <ProductPicks>.
import data from "./product-picks.json";

export interface ProductPick {
  name: string;
  url: string;
  image: string;
  description: string;
}
export interface ProductPicks {
  title: string;
  products: ProductPick[];
  ctaUrl: string | null;
}

const PICKS = data as Record<string, ProductPicks>;

/** Sélection produits d'une recette, ou null si aucune. */
export function getProductPicks(slug: string): ProductPicks | null {
  const p = PICKS[slug];
  return p && p.products.length > 0 ? p : null;
}
