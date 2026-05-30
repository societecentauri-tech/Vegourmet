import Link from "next/link";

/**
 * Chips de filtre = types de recette (taxonomie recette-type), fidèles au
 * rendu officiel du #search_section. Liens vers les pages de taxonomie.
 */
const TYPE_CHIPS = [
  { label: "Apéro Vegan", href: "/recette-type/apero-vegan" },
  { label: "Petit Déjeuner Vegan", href: "/recette-type/petit-dejeuner-vegan" },
  { label: "Plat Vegan", href: "/recette-type/plat-vegan" },
  { label: "Dessert Vegan", href: "/recette-type/dessert-vegan" },
  { label: "Snack Vegan", href: "/recette-type/snack-vegan" },
];

/**
 * RecipeFinder — « Trouvez la recette parfaite » (#search_section).
 * Fond rose/pêche, titre centré, champ de recherche (POC non fonctionnel)
 * + chips de filtres par type de recette.
 */
export function RecipeFinder() {
  return (
    <section
      id="search_section"
      className="vgh-search"
      aria-labelledby="vgh-search-title"
    >
      <div className="vgh-container">
        <div className="vgh-search-wrap">
          <header className="vgh-header">
            <span className="vgh-subtitle">Vous ne savez pas quoi cuisiner ?</span>
            <h2 id="vgh-search-title">Trouvez la recette parfaite</h2>
          </header>

          <form
            className="vgh-search-form"
            role="search"
            aria-label="Rechercher une recette"
          >
            <label className="vgh-sr-only" htmlFor="vgh-search-field">
              Rechercher une recette
            </label>
            <input
              id="vgh-search-field"
              type="search"
              name="s"
              placeholder="Rechercher…"
            />
            <button type="button">Rechercher</button>
          </form>

          <div className="vgh-chips">
            {TYPE_CHIPS.map((chip) => (
              <Link key={chip.href} href={chip.href} className="vgh-chip">
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
