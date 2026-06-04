// GÉNÉRÉ — slugs + libellés des taxonomies (source : archives vegourmet.fr, libellés curés).
import type { TaxoKind } from "./taxonomy";

export const TAXO_LABELS: Record<TaxoKind, Record<string, string>> = {
  "recette-type": {
    "apero-vegan": "Apéro vegan",
    "dessert-vegan": "Dessert vegan",
    "petit-dejeuner-vegan": "Petit-déjeuner vegan",
    "plat-vegan": "Plat vegan",
    "snack-vegan": "Snack vegan"
  },
  "recette-style": {
    "americaine": "Américaine",
    "europeenne": "Européenne",
    "inde": "Inde",
    "moyen-orient": "Moyen-Orient"
  },
  "recette-thematique": {
    "froid": "Froid",
    "repas-rapide": "Repas rapide",
    "sans-gluten": "Sans gluten",
    "sans-soja": "Sans soja"
  },
  "category": {
    "actualites-et-tendances": "Actualités & tendances",
    "conseils-et-astuces": "Conseils et astuces",
    "guides-pratiques": "Guides pratiques",
    "inspiration-et-lifestyle": "Inspiration & Lifestyle"
  }
};

export function taxoSlugs(kind: TaxoKind): string[] {
  return Object.keys(TAXO_LABELS[kind] ?? {});
}
