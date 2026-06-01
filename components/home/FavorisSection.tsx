"use client";

import { useState } from "react";
import { FavorisCard, type FavorisItem } from "./FavorisCard";

/** Onglet de la section favoris : exactement 3, non liés aux catégories. */
type TabKey = "featured" | "populaires" | "dernieres";

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: "featured", label: "Featured" },
  { key: "populaires", label: "Populaires" },
  { key: "dernieres", label: "Dernières" },
];

interface FavorisSectionProps {
  /**
   * Les 3 jeux de 4 cartes, déjà constitués côté serveur :
   *   - featured  : 4 recettes mises en avant (curation déterministe) ;
   *   - populaires: 4 autres recettes (sous-ensemble déterministe distinct) ;
   *   - dernieres : 4 recettes les plus récentes (tri datePublished desc).
   */
  featured: FavorisItem[];
  populaires: FavorisItem[];
  dernieres: FavorisItem[];
}

/**
 * FavorisSection — « Les favoris de nos lecteurs » (#featured_area_section).
 *
 * Les onglets NE sont PAS des catégories : ce sont exactement
 * « Featured / Populaires / Dernières », chacun affichant 4 cartes.
 * Au changement d'onglet, les cartes sont re-montées (`key={active}`) pour
 * rejouer l'animation CSS (fade + léger slide-up, ~300 ms).
 */
export function FavorisSection({
  featured,
  populaires,
  dernieres,
}: FavorisSectionProps) {
  const [active, setActive] = useState<TabKey>("featured");

  const items: Record<TabKey, FavorisItem[]> = {
    featured,
    populaires,
    dernieres,
  };
  const current = items[active];

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
            Parcourez quelques-unes des recettes vegan les plus appréciées par
            nos lecteurs.
          </p>
        </header>

        <div
          className="vgh-filters vgh-tabs"
          role="tablist"
          aria-label="Sélection de recettes"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`vgh-tab-${tab.key}`}
              aria-selected={active === tab.key}
              aria-controls="vgh-favoris-panel"
              className="vgh-filter vgh-tab"
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          key={active}
          id="vgh-favoris-panel"
          role="tabpanel"
          aria-labelledby={`vgh-tab-${active}`}
          className="vgh-grid-4 vgh-fav-grid vgh-fav-anim"
        >
          {current.map((item) => (
            <FavorisCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
