/**
 * ProductSlot — placeholder masqué pour les blocs comparatifs futurs.
 *
 * L'IA pose `<ProductSlot theme="margarine" type="comparison-top3" />` dans le
 * contenu MDX à l'emplacement du futur comparatif produits. Le composant ne
 * rend rien (`return null`) pendant ~2 jours, le temps qu'un job externe
 * remplace textuellement la balise par un vrai bloc (ComparisonTable +
 * ProductCard).
 *
 * Il doit simplement exister pour que le build MDX passe sans erreur tant que
 * la balise est présente dans les fichiers .mdx.
 */

export interface ProductSlotProps {
  /** Thème du comparatif futur, ex : "margarine", "huile-olive". */
  theme: string;
  /** Type de bloc futur, ex : "comparison-top3", "single-pick". Optionnel. */
  type?: string;
}

/** Placeholder invisible — ne rend rien. Remplacé par un job externe. */
export function ProductSlot(_props: ProductSlotProps): null {
  return null;
}
