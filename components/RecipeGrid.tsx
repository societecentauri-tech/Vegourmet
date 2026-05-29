import Link from "next/link";
import type { ArticleFrontmatter, RecipeFrontmatter } from "@/lib/types";
import { getCategoryColor, getCategoryHref } from "@/lib/categoryStyle";
import { Placeholder } from "./Placeholder";
import "./listing.css";

/** Élément normalisé affiché dans la grille de listing. */
export interface ListingItem {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  /** Temps total (recettes uniquement). */
  totalTime?: string;
  /** Niveau de difficulté (recettes uniquement). */
  difficulty?: string;
  ratio: string;
}

/** Transforme une recette en élément de listing. */
export function recipeToListingItem(recipe: RecipeFrontmatter): ListingItem {
  return {
    slug: recipe.slug,
    href: `/recettes/${recipe.slug}`,
    title: recipe.title,
    excerpt: recipe.description,
    category: recipe.category,
    totalTime: recipe.totalTime,
    difficulty: recipe.difficulty,
    ratio: "3 / 4",
  };
}

/** Transforme un article en élément de listing. */
export function articleToListingItem(article: ArticleFrontmatter): ListingItem {
  return {
    slug: article.slug,
    href: `/${article.slug}`,
    title: article.title,
    excerpt: article.description,
    category: article.category,
    ratio: "3 / 4",
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

function CategoryGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-1.5v6h-1V2h-1v6h-1V2H7Zm10 0c-1.1 0-2 1.79-2 4v6h1.5v8H18v-8h.5C18.78 12 19 11.5 19 11V6c0-2.21-.9-4-2-4Z" />
    </svg>
  );
}

interface ItemCardProps {
  item: ListingItem;
}

/** Carte de listing identique au site (dr-archive-single). */
export function ItemCard({ item }: ItemCardProps) {
  const catColor = getCategoryColor(item.category);

  return (
    <article className="vg-item">
      <figure className="vg-item-thumb">
        <Link href={item.href}>
          <Placeholder
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
          >
            <span
              className="vg-item-cat-circle"
              style={{ background: catColor }}
            >
              <CategoryGlyph />
            </span>
            <span className="vg-item-cat-name">{item.category}</span>
          </Link>
        </span>
      </figure>

      <div className="vg-item-details">
        <h2 className="vg-item-title">
          <Link href={item.href}>{item.title}</Link>
        </h2>
        <p className="vg-item-content">{item.excerpt}</p>
        {(item.totalTime || item.difficulty) && (
          <div className="vg-item-meta">
            {item.totalTime && (
              <span>
                <ClockIcon />
                {item.totalTime}
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
        {emptyMessage ?? "Aucun contenu pour cette page dans l'échantillon du POC."}
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
