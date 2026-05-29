import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import { getAllArticles, getAllRecipes } from "@/lib/content";
import type { RecipeFrontmatter } from "@/lib/types";

/* Pictogrammes de méta-recette (reprend les icônes du widget WP Delicious). */
function ClockIcon() {
  return (
    <svg
      className="meta-icon"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg
      className="meta-icon"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20h-20" />
    </svg>
  );
}

/** Carte recette « Yummy Bites » pour les grilles de la home (item-title / category / item-content). */
function HomeRecipeCard({ recipe }: { recipe: RecipeFrontmatter }) {
  return (
    <article className="recipe-card">
      <Link
        href={`/recettes/${recipe.slug}`}
        className="card-media"
        aria-label={recipe.title}
      >
        <span className="card-cat">{recipe.category}</span>
        <Placeholder alt={recipe.title} ratio="4 / 3" className="vg-ph" />
      </Link>
      <div className="card-body">
        <h3 className="card-title">
          <Link href={`/recettes/${recipe.slug}`}>{recipe.title}</Link>
        </h3>
        <p className="card-excerpt">{recipe.description}</p>
        <div className="recipe-item-meta">
          <span className="meta-chip">
            <ClockIcon />
            {recipe.totalTime}
          </span>
          <span className="meta-chip">
            <LevelIcon />
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </article>
  );
}

const CATEGORIES = [
  { href: "/recette-type/petit-dejeuner-vegan", label: "Petit Déjeuner Vegan" },
  { href: "/recette-type/apero-vegan", label: "Apéro Vegan" },
  { href: "/recette-type/plat-vegan", label: "Plat Vegan" },
  { href: "/recette-type/dessert-vegan", label: "Dessert Vegan" },
  { href: "/recette-type/snack-vegan", label: "Snack Vegan" },
];

export default function HomePage() {
  const recipes = getAllRecipes();
  const heroFeature = recipes[0]?.frontmatter;
  const heroSide = recipes.slice(1, 3).map((r) => r.frontmatter);
  const latest = recipes.slice(3, 9).map((r) => r.frontmatter);
  const articles = getAllArticles()
    .filter((article) => article.frontmatter.slug !== "a-propos")
    .slice(0, 3)
    .map((a) => a.frontmatter);

  return (
    <>
      {/* Hero / bannière (site-banner style-one) */}
      {heroFeature ? (
        <section id="banner_section" className="site-banner">
          <div className="vg-container">
            <div className="banner-grid">
              <article className="banner-item is-feature">
                <Link
                  href={`/recettes/${heroFeature.slug}`}
                  className="item-img"
                  aria-label={heroFeature.title}
                >
                  <Placeholder
                    alt={heroFeature.title}
                    ratio="3 / 4"
                    className="vg-ph"
                  />
                </Link>
                <div className="banner-caption">
                  <div className="cat-links">
                    <Link href="/recette-type/plat-vegan">
                      {heroFeature.category}
                    </Link>
                  </div>
                  <h2 className="item-title">
                    <Link href={`/recettes/${heroFeature.slug}`}>
                      {heroFeature.title}
                    </Link>
                  </h2>
                  <div className="item-content">
                    <p>{heroFeature.description}</p>
                  </div>
                </div>
              </article>

              <div className="banner-side">
                {heroSide.map((recipe) => (
                  <article key={recipe.slug} className="banner-item">
                    <Link
                      href={`/recettes/${recipe.slug}`}
                      className="item-img"
                      aria-label={recipe.title}
                    >
                      <Placeholder
                        alt={recipe.title}
                        ratio="16 / 9"
                        className="vg-ph"
                      />
                    </Link>
                    <div className="banner-caption">
                      <div className="cat-links">
                        <Link href="/recettes">{recipe.category}</Link>
                      </div>
                      <h2 className="item-title">
                        <Link href={`/recettes/${recipe.slug}`}>
                          {recipe.title}
                        </Link>
                      </h2>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Dernières recettes */}
      <section className="vg-section">
        <div className="vg-container">
          <div className="section-head">
            <span className="section-eyebrow">À déguster maintenant</span>
            <h2>Nos dernières recettes vegan</h2>
            <p className="section-sub">
              Des recettes végétales simples, gourmandes et testées en cuisine,
              prêtes à rejoindre vos repas du quotidien.
            </p>
          </div>
          <div className="vg-grid">
            {latest.map((recipe) => (
              <HomeRecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
          <div className="section-cta">
            <Link href="/recettes" className="btn-primary">
              Voir toutes les recettes
            </Link>
          </div>
        </div>
      </section>

      {/* Blocs catégories */}
      <section className="vg-section alt">
        <div className="vg-container">
          <div className="section-head">
            <span className="section-eyebrow">Par envie</span>
            <h2>Explorer par catégorie</h2>
            <p className="section-sub">
              Du petit-déjeuner au dessert, trouvez l&apos;inspiration vegan qui
              correspond à votre moment de la journée.
            </p>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.href} href={cat.href} className="cat-tile">
                <Placeholder alt={cat.label} ratio="1 / 1" className="vg-ph" />
                <span className="cat-tile-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sur le blog */}
      {articles.length > 0 ? (
        <section className="vg-section">
          <div className="vg-container">
            <div className="section-head">
              <span className="section-eyebrow">Le journal</span>
              <h2>Sur le blog Vegourmet</h2>
              <p className="section-sub">
                Guides pratiques, conseils et astuces pour cuisiner vegan au
                quotidien sans prise de tête.
              </p>
            </div>
            <div className="vg-grid">
              {articles.map((article) => (
                <article key={article.slug} className="recipe-card">
                  <Link
                    href={`/${article.slug}`}
                    className="card-media"
                    aria-label={article.title}
                  >
                    <span className="card-cat">{article.category}</span>
                    <Placeholder
                      alt={article.title}
                      ratio="4 / 3"
                      className="vg-ph"
                    />
                  </Link>
                  <div className="card-body">
                    <h3 className="card-title">
                      <Link href={`/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="card-excerpt">{article.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="section-cta">
              <Link href="/blog" className="btn-primary">
                Lire le blog
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
