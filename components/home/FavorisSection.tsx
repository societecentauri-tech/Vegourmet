"use client";

import { useMemo, useState } from "react";
import { RecipeGrid, type ListingItem } from "@/components/RecipeGrid";

/** Onglet de filtre : « Toutes » + une entrée par catégorie réelle. */
interface FilterTab {
  /** Identifiant interne (catégorie exacte ou "all"). */
  value: string;
  label: string;
}

interface FavorisSectionProps {
  /** Recettes normalisées (déjà transformées côté serveur). */
  items: ListingItem[];
}

/**
 * FavorisSection — « Les favoris de nos lecteurs » (#featured_area_section).
 * Sur-titre + titre centrés, rangée d'onglets de filtre par catégorie,
 * grille de cartes (composant partagé RecipeGrid) filtrée côté client.
 */
export function FavorisSection({ items }: FavorisSectionProps) {
  // Construit la liste des onglets depuis les catégories réellement présentes.
  const tabs = useMemo<FilterTab[]>(() => {
    const categories = Array.from(new Set(items.map((item) => item.category)));
    return [
      { value: "all", label: "Toutes" },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [items]);

  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(
    () =>
      active === "all"
        ? items
        : items.filter((item) => item.category === active),
    [active, items],
  );

  return (
    <section
      id="featured_area_section"
      className="vgh-section vgh-section--featured"
      aria-labelledby="vgh-favoris-title"
    >
      <div className="vgh-container">
        <header className="vgh-header">
          <span className="vgh-subtitle">Sélection gourmande</span>
          <h2 id="vgh-favoris-title">Les favoris de nos lecteurs</h2>
          <p>
            Parcourez quelques-unes des recettes vegan les plus populaires
            parmi les lecteurs.
          </p>
        </header>

        <div className="vgh-filters" role="group" aria-label="Filtrer par catégorie">
          {tabs.map((tab) => (
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
            emptyMessage="Aucune recette dans cette catégorie pour le moment."
          />
        </div>
      </div>
    </section>
  );
}
