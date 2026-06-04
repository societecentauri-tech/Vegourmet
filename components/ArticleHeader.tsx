import Link from "next/link";
import type { ArticleFrontmatter } from "@/lib/types";
import { getCategoryColor, getCategoryHref } from "@/lib/categoryStyle";
import { formatDateFr } from "@/lib/format";
import { SmartImage } from "./SmartImage";
import "./article.css";

interface ArticleHeaderProps {
  article: ArticleFrontmatter;
  /** Temps de lecture estimé, ex. « 16 min de lecture ». */
  readingTime?: string;
}

/** Initiale d'auteur pour l'avatar. */
function authorInitial(author: string): string {
  return author.trim().charAt(0).toUpperCase() || "·";
}

/** En-tête d'article fidèle au thème Yummy Bites (pastille / titre / méta / hero). */
export function ArticleHeader({ article, readingTime }: ArticleHeaderProps) {
  const catColor = getCategoryColor(article.category);

  return (
    <header className="vg-entry-header">
      <span
        className="vg-cat-links"
        style={{ ["--vg-cat-color" as string]: catColor }}
      >
        <Link href={getCategoryHref(article.category)}>{article.category}</Link>
      </span>

      <h1 className="vg-entry-title">{article.title}</h1>

      <div className="vg-entry-meta">
        <span className="vg-author">
          <span className="vg-author-avatar" aria-hidden="true">
            {authorInitial(article.author)}
          </span>
          {article.author}
        </span>
        <span className="vg-dot">
          Modifié le{" "}
          {(() => {
            const d = article.dateModified ?? article.datePublished;
            return <time dateTime={d}>{formatDateFr(d)}</time>;
          })()}
        </span>
        {readingTime && <span className="vg-dot">{readingTime}</span>}
      </div>

      <div className="vg-hero">
        <SmartImage src={article.heroImage?.src} alt={article.title} ratio="720 / 950" />
      </div>
    </header>
  );
}
