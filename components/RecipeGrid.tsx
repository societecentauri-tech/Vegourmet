import Link from "next/link";
import type { ArticleFrontmatter, RecipeFrontmatter } from "@/lib/types";
import {
  type CategoryGlyph,
  getCategoryHref,
  getCategoryStyle,
} from "@/lib/categoryStyle";
import { SmartImage } from "./SmartImage";
import { formatDureeFr } from "@/lib/duration";
import { formatDateFr } from "@/lib/format";
import "./listing.css";

/** Élément normalisé affiché dans la grille de listing. */
export interface ListingItem {
  slug: string;
  href: string;
  title: string;
  category: string;
  /** Temps total (recettes uniquement). */
  totalTime?: string;
  /** Niveau de difficulté (recettes uniquement). */
  difficulty?: string;
  /** URL de l'image hero (bucket S3). */
  imageSrc?: string;
  ratio: string;
  /** Date à afficher (ISO). Utilisé dans le widget « Tu aimeras aussi » (articles). */
  dateDisplay?: string;
}

/** Transforme une recette en élément de listing. */
export function recipeToListingItem(recipe: RecipeFrontmatter): ListingItem {
  return {
    slug: recipe.slug,
    href: `/recettes/${recipe.slug}`,
    title: recipe.title,
    category: recipe.category,
    totalTime: recipe.totalTime,
    difficulty: recipe.difficulty,
    imageSrc: recipe.heroImage?.src,
    ratio: "3 / 4",
  };
}

/** Transforme un article en élément de listing.
 * `dateDisplay` = dateModified si présent (W2.3), sinon fallback datePublished. */
export function articleToListingItem(article: ArticleFrontmatter): ListingItem {
  return {
    slug: article.slug,
    href: `/${article.slug}`,
    title: article.title,
    category: article.category,
    imageSrc: article.heroImage?.src,
    ratio: "3 / 4",
    dateDisplay: article.dateModified ?? article.datePublished,
  };
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M4 20V10M12 20V4M20 20v-7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Glyphes blancs centrés dans la pastille catégorie (un par famille). */
function CategoryIcon({ glyph }: { glyph: CategoryGlyph }) {
  switch (glyph) {
    case "plate":
      // Couverts (fourchette + couteau) — plats.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-1.5v6h-1V2h-1v6h-1V2H7Zm10 0c-1.1 0-2 1.79-2 4v6h1.5v8H18v-8h.5C18.78 12 19 11.5 19 11V6c0-2.21-.9-4-2-4Z" />
        </svg>
      );
    case "drink":
      // Verre / cocktail — apéro.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 3h18l-7 8.5V19h3v2H7v-2h3v-7.5L3 3Zm3.2 2 2.46 3h6.68l2.46-3H6.2Z" />
        </svg>
      );
    case "cake":
      // Part de gâteau — desserts.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2c.7 1 1.5 1.9 1.5 3a1.5 1.5 0 0 1-3 0c0-1.1.8-2 1.5-3ZM6 9a2 2 0 0 0-2 2v1.2c.9.5 1.7 1 3 1 1.4 0 2.1-.6 3-1 .9.4 1.6 1 3 1 1.4 0 2.1-.6 3-1 1.3 0 2.1.5 3 1V11a2 2 0 0 0-2-2H6Zm-2 5.7V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.3c-.9.4-1.7.8-3 .8-1.4 0-2.1-.6-3-1-.9.4-1.6 1-3 1-1.4 0-2.1-.6-3-1-.9.4-1.7 1-3 1-1.3 0-2.1-.4-3-.8Z" />
        </svg>
      );
    case "coffee":
      // Tasse — petit-déjeuner.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 0h2a3 3 0 0 1 0 6h-2v-2h2a1 1 0 0 0 0-2h-2V8ZM4 20h12v2H4v-2Z" />
        </svg>
      );
    case "snack":
      // Cookie — snacks.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-1-2Zm-3 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-6 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      );
    case "leaf":
    default:
      // Feuille végétale — articles de blog.
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 21c-1-6 1-12 8-14 3-1 6-1 6-1s.4 4-1 7c-2 4-6 5-9 5 .5-2 2-4 4-5-3 .5-5 2-6 4-.4.8-.7 1.8-1 3l-1 1Z" />
        </svg>
      );
  }
}

interface ItemCardProps {
  item: ListingItem;
}

/**
 * Carte de listing fidèle au thème (dr-archive-single / post-thumbnail).
 * Image portrait 3/4, pastille ronde catégorie posée au bas-centre de l'image,
 * titre centré, ligne méta (temps + difficulté) centrée.
 */
export function ItemCard({ item }: ItemCardProps) {
  const { color, glyph } = getCategoryStyle(item.category);

  return (
    <article className="vg-item">
      <figure className="vg-item-thumb">
        <Link href={item.href}>
          <SmartImage
            src={item.imageSrc}
            alt={item.title}
            ratio={item.ratio}
            className="vg-thumb-img border-0"
          />
        </Link>
        <span className="vg-item-cat">
          <Link
            href={getCategoryHref(item.category)}
            title={item.category}
            aria-label={`Catégorie : ${item.category}`}
            className="vg-item-cat-link"
            style={{
              background: color,
              /* display:flex inline pour ne pas être écrasé par le Preflight Tailwind */
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon glyph={glyph} />
          </Link>
          {/* Infobulle rendue hors du lien pour ne pas perturber le centrage flex */}
          <span className="vg-item-cat-name" aria-hidden="true">
            {item.category}
          </span>
        </span>
      </figure>

      <div className="vg-item-details">
        <h2 className="vg-item-title">
          <Link href={item.href}>{item.title}</Link>
        </h2>
        {item.dateDisplay && (
          <p className="vg-item-date">
            Modifié le{" "}
            <time dateTime={item.dateDisplay}>{formatDateFr(item.dateDisplay)}</time>
          </p>
        )}
        {(item.totalTime || item.difficulty) && (
          <div className="vg-item-meta">
            {item.totalTime && (
              <span>
                <ClockIcon />
                {formatDureeFr(item.totalTime)}
              </span>
            )}
            {item.difficulty && (
              <span>
                <LevelIcon />
                {item.difficulty}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

interface RecipeGridProps {
  items: ListingItem[];
  emptyMessage?: string;
}

/** Grille de cartes partagée par /blog, /recettes et les taxonomies. */
export function RecipeGrid({ items, emptyMessage }: RecipeGridProps) {
  if (items.length === 0) {
    return (
      <p className="vg-empty">
        {emptyMessage ??
          "Aucun contenu pour cette page dans l'échantillon du POC."}
      </p>
    );
  }

  return (
    <div className="vg-grid">
      {items.map((item) => (
        <ItemCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
