"use client";

import { PrintIcon } from "./RecipeIcons";

/**
 * RecipePrintButton — bouton « Imprimer la recette » de la recipe card.
 * Ouvre la page d'impression dédiée (recette seule) dans un nouvel onglet.
 */
export function RecipePrintButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      className="vg-print"
      onClick={() =>
        window.open(`/recettes/${slug}/imprimer`, "_blank", "noopener")
      }
      aria-label="Imprimer la recette"
    >
      <PrintIcon />
      <span>Imprimer la recette</span>
    </button>
  );
}
