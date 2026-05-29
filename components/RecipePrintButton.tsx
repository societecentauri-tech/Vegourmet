"use client";

import { PrintIcon } from "./RecipeIcons";

/**
 * RecipePrintButton — bouton « Imprimer la recette » de la recipe card.
 * Déclenche window.print() côté client (reproduit le bouton print WP Delicious).
 */
export function RecipePrintButton() {
  return (
    <button
      type="button"
      className="vg-print"
      onClick={() => window.print()}
      aria-label="Imprimer la recette"
    >
      <PrintIcon />
      <span>Imprimer la recette</span>
    </button>
  );
}
