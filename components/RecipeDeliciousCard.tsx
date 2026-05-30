import { SmartImage } from "./SmartImage";
import { RecipePrintButton } from "./RecipePrintButton";
import {
  AuthorIcon,
  ClockIcon,
  CuisineIcon,
  DifficultyIcon,
  FireIcon,
  ServingsIcon,
  StarIcon,
  TagIcon,
  TimerIcon,
} from "./RecipeIcons";
import type { RecipeFrontmatter } from "@/lib/types";

interface RecipeDeliciousCardProps {
  recipe: RecipeFrontmatter;
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
 * RecipeDeliciousCard — carte recette imprimable façon WP Delicious (thème Yummy Bites).
 * Élément signature de la page recette vegourmet.fr : image hero + bouton imprimer,
 * notation étoiles, byline (auteur / origine), bandeau meta (préparation, cuisson,
 * total, portions, difficulté), description, ingrédients cochables, étapes numérotées,
 * informations nutritionnelles et mots-clés.
 */
export function RecipeDeliciousCard({ recipe }: RecipeDeliciousCardProps) {
  const {
    title,
    author,
    cuisine,
    prepTime,
    cookTime,
    totalTime,
    servings,
    difficulty,
    description,
    ingredients,
    steps,
    nutrition,
    tags,
    heroImage,
  } = recipe;

  const hasNutrition =
    nutrition !== undefined && Object.values(nutrition).some(Boolean);

  return (
    <section
      className="vg-card"
      aria-labelledby="vg-recipe-card-title"
      id="recette"
    >
      <div className="vg-card__top">
        <div className="vg-card__media">
          <SmartImage
            src={heroImage?.src}
            alt={title}
            ratio="3 / 4"
            className="h-full w-full rounded-none border-0"
          />
        </div>

        <div className="vg-card__head">
          <span className="vg-rating">
            <span className="vg-stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} />
              ))}
            </span>
            <span>
              <span className="vg-rating-num">4,9</span>
              <span className="vg-rating-sep" aria-hidden="true">
                /
              </span>
              10 avis
            </span>
          </span>

          <h2 className="vg-card__title" id="vg-recipe-card-title">
            {title}
          </h2>

          <div className="vg-byline">
            <span className="vg-byline__item">
              <AuthorIcon />
              <span className="vg-byline__label">Auteur&nbsp;:</span> {author}
            </span>
            {cuisine && (
              <span className="vg-byline__item">
                <CuisineIcon />
                <span className="vg-byline__label">Origine&nbsp;:</span>{" "}
                {cuisine}
              </span>
            )}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <RecipePrintButton />
          </div>
        </div>
      </div>

      <div className="vg-meta-bar">
        <div className="vg-meta-cell">
          <ClockIcon />
          <span className="vg-meta-label">Préparation</span>
          <span className="vg-meta-value">{prepTime}</span>
        </div>
        <div className="vg-meta-cell">
          <FireIcon />
          <span className="vg-meta-label">Cuisson</span>
          <span className="vg-meta-value">{cookTime}</span>
        </div>
        <div className="vg-meta-cell">
          <TimerIcon />
          <span className="vg-meta-label">Totale</span>
          <span className="vg-meta-value">{totalTime}</span>
        </div>
        <div className="vg-meta-cell">
          <ServingsIcon />
          <span className="vg-meta-label">Portions</span>
          <span className="vg-meta-value">{servings}</span>
        </div>
      </div>

      {difficulty && (
        <div className="vg-meta-bar" style={{ gridTemplateColumns: "1fr" }}>
          <div
            className="vg-meta-cell"
            style={{
              flexDirection: "row",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            <DifficultyIcon />
            <span className="vg-meta-label">Difficulté</span>
            <span className="vg-meta-value">{difficulty}</span>
          </div>
        </div>
      )}

      {description && (
        <div className="vg-section">
          <h3 className="vg-section__title">Description</h3>
          <p style={{ margin: 0, lineHeight: 1.65 }}>{description}</p>
        </div>
      )}

      <div className="vg-section">
        <h3 className="vg-section__title">Ingrédients</h3>
        <ul className="vg-ingredients">
          {ingredients.map((ing, i) => {
            const id = `vg-ing-${i}`;
            const qty = [ing.quantity, ing.unit]
              .filter(Boolean)
              .join(" ")
              .trim();
            return (
              <li className="vg-ingredient" key={`${ing.name}-${i}`}>
                <input type="checkbox" id={id} />
                <label htmlFor={id}>
                  {qty && <span className="vg-ing-qty">{qty} </span>}
                  {ing.name}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="vg-section">
        <h3 className="vg-section__title">Instructions</h3>
        <ol className="vg-steps">
          {steps.map((step, i) => (
            <li className="vg-step" key={i}>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {hasNutrition && (
        <div className="vg-section">
          <h3 className="vg-section__title">Informations nutritionnelles</h3>
          <div className="vg-nutrition">
            {NUTRITION_LABELS.filter(({ key }) => nutrition?.[key]).map(
              ({ key, label }) => (
                <div className="vg-nutri-cell" key={key}>
                  <span className="vg-nutri-value">{nutrition?.[key]}</span>
                  <span className="vg-nutri-label">{label}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="vg-section">
          <h3 className="vg-section__title">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <TagIcon
                style={{
                  width: 18,
                  height: 18,
                  fill: "var(--vg-terracotta, #d98e73)",
                }}
              />
              Mots-clés
            </span>
          </h3>
          <div className="vg-keywords">
            {tags.map((tag) => (
              <span className="vg-keyword" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
