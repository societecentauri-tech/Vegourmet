"use client";

import { PrintIcon } from "./RecipeIcons";

/** Bouton « Imprimer la recette » (déclenche window.print). */
export function PrintButton() {
  return (
    <button
      type="button"
      className="vg-btn-print"
      onClick={() => window.print()}
    >
      <PrintIcon />
      Imprimer la recette
    </button>
  );
}
