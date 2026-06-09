import { PrintControls } from "./PrintControls";
import { StarRating } from "./StarRating";
import { formatDureeFr } from "@/lib/duration";
import { SITE_URL } from "@/lib/seo";
import type { RecipeRating } from "@/lib/ratings";
import type { RecipeFrontmatter } from "@/lib/types";
import "./print-recipe.css";

interface PrintRecipeViewProps {
  recipe: RecipeFrontmatter;
  /** Note agrégée réelle (snapshot build). null = recette non notée. */
  rating?: RecipeRating | null;
}

const NUTRITION_LABELS: {
  key: keyof NonNullable<RecipeFrontmatter["nutrition"]>;
  label: string;
}[] = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protéines" },
  { key: "carbs", label: "Glucides" },
  { key: "fat", label: "Lipides" },
];

/**
 * PrintRecipeView — page d'impression dédiée d'une recette vegourmet.fr.
 * Mise en forme propre, sobre et économe en encre : titre, méta (temps /
 * portions / difficulté), ingrédients, instructions, nutrition, pied avec la
 * source. Aucun élément de navigation, pub, sidebar, avis ou affiliation.
 */
export function PrintRecipeView({ recipe, rating }: PrintRecipeViewProps) {
  const {
    title,
    author,
    prepTime,
    cookTime,
    totalTime,
    servings,
    difficulty,
    ingredients,
    steps,
    nutrition,
    heroImage,
  } = recipe;

  const recipeHref = `/recettes/${recipe.slug}/`;
  const sourceUrl = `${SITE_URL}${recipeHref}`;
  const hasNutrition =
    nutrition !== undefined && Object.values(nutrition).some(Boolean);
  const hasRating = !!rating && rating.ratingCount > 0;
  const ratingValueFr = hasRating
    ? rating.ratingValue.toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
    : null;

  return (
    <div className="vg-print-page">
      <PrintControls recipeHref={recipeHref} />

      <article className="vg-print-recipe">
        <header className="vg-print-head">
          {heroImage?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="vg-print-hero"
              src={heroImage.src}
              alt={title}
              width={120}
              height={120}
            />
          )}
          <div className="vg-print-titlewrap">
            <h1 className="vg-print-title">{title}</h1>
            {hasRating && (
              <span className="vg-print-rating">
                <StarRating value={rating.ratingValue} size={15} />
                <span className="vg-print-rating-num">{ratingValueFr}</span>
                <span className="vg-print-rating-count">
                  ({rating.ratingCount} avis)
                </span>
              </span>
            )}
            <p className="vg-print-by">Par {author} · vegourmet.fr</p>
          </div>
        </header>

        <dl className="vg-print-meta">
          <div>
            <dt>Préparation</dt>
            <dd>{formatDureeFr(prepTime)}</dd>
          </div>
          <div>
            <dt>Cuisson</dt>
            <dd>{formatDureeFr(cookTime)}</dd>
          </div>
          <div>
            <dt>Totale</dt>
            <dd>{formatDureeFr(totalTime)}</dd>
          </div>
          <div>
            <dt>Portions</dt>
            <dd>{servings}</dd>
          </div>
          {difficulty && (
            <div>
              <dt>Difficulté</dt>
              <dd>{difficulty}</dd>
            </div>
          )}
        </dl>

        <section className="vg-print-section">
          <h2>Ingrédients</h2>
          <ul className="vg-print-ingredients">
            {ingredients.map((ing, i) => {
              const qty = [ing.quantity, ing.unit].filter(Boolean).join(" ").trim();
              return (
                <li key={`${ing.name}-${i}`}>
                  <span className="vg-print-box" aria-hidden="true" />
                  {qty && <span className="vg-print-qty">{qty} </span>}
                  {ing.name}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="vg-print-section">
          <h2>Instructions</h2>
          <ol className="vg-print-steps">
            {steps.map((step, i) => (
              <li key={i}>{step.text}</li>
            ))}
          </ol>
        </section>

        {hasNutrition && (
          <section className="vg-print-section">
            <h2>Informations nutritionnelles</h2>
            <ul className="vg-print-nutrition">
              {NUTRITION_LABELS.filter(({ key }) => nutrition?.[key]).map(
                ({ key, label }) => (
                  <li key={key}>
                    <strong>{nutrition?.[key]}</strong> {label}
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

        <footer className="vg-print-foot">
          Recette extraite de <strong>{sourceUrl}</strong> — © Vegourmet
        </footer>
      </article>
    </div>
  );
}
