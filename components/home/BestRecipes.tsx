"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RecipeGrid, type ListingItem } from "@/components/RecipeGrid";

/** Item de listing enrichi des tags pour le filtrage côté client. */
export interface TaggedListingItem extends ListingItem {
  tags: string[];
}

interface FilterTab {
  /** "all" ou un tag exact (en minuscules) à matcher. */
  value: string;
  label: string;
}

/**
 * Onglets fidèles au #category_section officiel : « Repas rapides »,
 * « Sans Gluten », « Sans soja » (tags réellement présents dans le contenu).
 */
const TABS: FilterTab[] = [
  { value: "all", label: "Toutes" },
  { value: "repas rapides", label: "Repas rapides" },
  { value: "sans gluten", label: "Sans Gluten" },
  { value: "sans soja", label: "Sans soja" },
];

interface BestRecipesProps {
  items: TaggedListingItem[];
}

/**
 * BestRecipes — « Découvre nos meilleures recettes » (#category_section).
 * Titre centré, onglets de filtre par tag, grille de cartes (composant
 * partagé) filtrée côté client, bouton « Voir toutes les recettes ».
 */
export function BestRecipes({ items }: BestRecipesProps) {
  const [active, setActive] = useState<string>("all");

  // Cap à 8 cartes : la grille « meilleures recettes » est une vitrine, pas un
  // listing exhaustif (le bouton « Voir toutes les recettes » mène à /recettes).
  const MAX_BEST = 8;
  const filtered = useMemo(() => {
    const base =
      active === "all"
        ? items
        : items.filter((item) =>
            item.tags.some((tag) => tag.toLowerCase() === active),
          );
    return base.slice(0, MAX_BEST);
  }, [active, items]);

  return (
    <section
      id="category_section"
      className="vgh-section vgh-section--best"
      aria-labelledby="vgh-best-title"
    >
      <div className="vgh-container">
        <header className="vgh-header">
          <h2 id="vgh-best-title">Découvre nos meilleures recettes</h2>
          <p>
            Voici quelques-unes des meilleures recettes vegan appréciées par les
            lecteurs. Prépare et déguste ces recettes avec tes amis et ta
            famille.
          </p>
        </header>

        <div className="vgh-filters" role="group" aria-label="Filtrer par type de recette">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className="vgh-filter"
              aria-pressed={active === tab.value}
              onClick={() => setActive(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="vgh-grid-4">
          <RecipeGrid
            items={filtered}
            emptyMessage="Aucune recette ne correspond à ce filtre pour le moment."
          />
        </div>

        <div className="vgh-cta-center">
          <Link href="/recettes" className="btn-primary">
            Voir toutes les recettes
          </Link>
        </div>
      </div>
    </section>
  );
}
