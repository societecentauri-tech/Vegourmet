"use client";

import { PrintIcon } from "./RecipeIcons";

/** Bouton « Imprimer la recette » : ouvre la page d'impression dédiée (recette
 * seule, mise en forme propre) dans un nouvel onglet, qui lance l'aperçu. */
export function PrintButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      className="vg-btn-print"
      onClick={() =>
        window.open(`/recettes/${slug}/imprimer`, "_blank", "noopener")
      }
    >
      <PrintIcon />
      Imprimer la recette
    </button>
  );
}
