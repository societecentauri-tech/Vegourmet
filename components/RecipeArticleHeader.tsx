import { Placeholder } from "./Placeholder";
import type { RecipeFrontmatter } from "@/lib/types";

interface RecipeArticleHeaderProps {
  recipe: RecipeFrontmatter;
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
export function RecipeArticleHeader({ recipe }: RecipeArticleHeaderProps) {
  const { title, category, author, datePublished } = recipe;

  return (
    <header className="vg-article-head">
      {category && <span className="vg-article-cat">{category}</span>}

      <h1 className="vg-article-title">{title}</h1>

      <div className="vg-article-meta">
        <span>
          Par <strong>{author}</strong>
        </span>
        <span className="vg-dot" aria-hidden="true" />
        <time dateTime={datePublished}>{formatDate(datePublished)}</time>
      </div>

      <div style={{ margin: "1.4rem 0 1.25rem" }}>
        <Placeholder alt={title} ratio="16 / 9" />
      </div>

      <a href="#recette" className="vg-jump">
        Aller à la recette
      </a>
    </header>
  );
}
