"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PrintIcon } from "./RecipeIcons";

interface PrintControlsProps {
  /** Lien retour vers la recette complète. */
  recipeHref: string;
}

/**
 * PrintControls — déclenche automatiquement l'aperçu avant impression à
 * l'ouverture de la page d'impression dédiée, et affiche une barre d'outils
 * (masquée à l'impression) avec un bouton « Imprimer » et un retour recette.
 */
export function PrintControls({ recipeHref }: PrintControlsProps) {
  useEffect(() => {
    // Laisse le temps au rendu + à l'image hero de charger avant l'aperçu.
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="vg-print-toolbar" role="toolbar" aria-label="Impression">
      <button type="button" className="vg-print-btn" onClick={() => window.print()}>
        <PrintIcon />
        Imprimer
      </button>
      <Link href={recipeHref} className="vg-print-back">
        ← Retour à la recette
      </Link>
    </div>
  );
}
