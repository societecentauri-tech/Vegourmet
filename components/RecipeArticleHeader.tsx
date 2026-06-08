import { SmartImage } from "./SmartImage";
import { StarRating } from "./StarRating";
import {
  CalendarIcon,
  CommentIcon,
  DifficultyIcon,
  GoToIcon,
  TimerIcon,
} from "./RecipeIcons";
import { PrintButton } from "./PrintButton";
import { getCategoryColor } from "@/lib/categoryStyle";
import type { RecipeRating } from "@/lib/ratings";
import type { RecipeFrontmatter } from "@/lib/types";

/** Avatar Gravatar de Chloé (mêmes assets/rendu que la byline blog). */
const CHLOE_GRAVATAR = "https://veg.s3.fr-par.scw.cloud/img/avatar-chloe.jpg";

interface RecipeArticleHeaderProps {
  recipe: RecipeFrontmatter;
  /** Note agrégée réelle (snapshot build). null = recette non notée. */
  rating?: RecipeRating | null;
}

/** Formate une date ISO en français long (ex. « 25 décembre 2024 »). */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * RecipeArticleHeader — en-tête de l'article-recette vegourmet.fr (thème Yummy Bites).
 * Catégorie, titre H1, méta auteur/date, image hero, puis bouton « Aller à la recette ».
 */
export function RecipeArticleHeader({ recipe, rating }: RecipeArticleHeaderProps) {
  const { title, category, author, datePublished, heroImage, totalTime, difficulty } =
    recipe;
  const hasRating = !!rating && rating.ratingCount > 0;
  const ratingValueFr = hasRating
    ? rating.ratingValue.toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
    : null;

  return (
    <header className="vg-article-head">
      <div className="vg-article-banner">
        {category && (
          <span
            className="vg-article-cat"
            style={{ ["--vg-cat-color" as string]: getCategoryColor(category) }}
          >
            {category}
          </span>
        )}

        <h1 className="vg-article-title">{title}</h1>

        <div className="vg-article-meta">
          <span className="vg-article-meta__item">
            {/* Avatar Gravatar Chloé rapatrié sur S3 (fidélité WP byline). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CHLOE_GRAVATAR}
              alt={author}
              width={30}
              height={30}
              className="vg-author-avatar-img"
              loading="lazy"
            />
            Par <strong>{author}</strong>
          </span>
          <span className="vg-dot" aria-hidden="true" />
          <span className="vg-article-meta__item">
            <CalendarIcon />
            <time dateTime={datePublished}>{formatDate(datePublished)}</time>
          </span>
          {hasRating && (
            <>
              <span className="vg-dot" aria-hidden="true" />
              <span className="vg-article-meta__item vg-article-rating">
                <StarRating value={rating.ratingValue} size={15} />
                <span className="vg-article-rating__val">{ratingValueFr}</span>
                <span className="vg-article-rating__count">
                  / {rating.ratingCount} avis
                </span>
              </span>
              {rating.reviewCount > 0 && (
                <>
                  <span className="vg-dot" aria-hidden="true" />
                  <a className="vg-article-meta__item vg-article-comments" href="#avis">
                    <CommentIcon />
                    {rating.reviewCount} commentaires
                  </a>
                </>
              )}
            </>
          )}
        </div>

        {(totalTime || difficulty) && (
          <div className="vg-article-stats">
            {totalTime && (
              <span className="vg-article-stat">
                <TimerIcon />
                Totale : <strong>{totalTime}</strong>
              </span>
            )}
            {totalTime && difficulty && (
              <span className="vg-article-stats-sep" aria-hidden="true" />
            )}
            {difficulty && (
              <span className="vg-article-stat">
                <DifficultyIcon />
                Difficulté : <strong>{difficulty}</strong>
              </span>
            )}
          </div>
        )}

        <div className="vg-article-actions">
          <a href="#recette" className="vg-jump">
            Aller à la recette
            <GoToIcon />
          </a>
          <PrintButton slug={recipe.slug} />
        </div>
      </div>

      <div className="vg-article-hero">
        {/* Hero portrait fidèle WP : image entière non rognée, ratio naturel
            724x1024 (≈ 0,707), affichée jusqu'à 724px de large et centrée. */}
        <SmartImage
          src={heroImage?.src}
          alt={title}
          fit="natural"
          ratio="724 / 1024"
          width={724}
          height={1024}
          priority
          sizes="(max-width: 768px) 100vw, 724px"
        />
      </div>
    </header>
  );
}
