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

/**
 * Avatar Gravatar Chloé rapatrié sur S3 (fidélité WP byline).
 * WP affiche le Gravatar ~30px arrondi à côté du nom dans la meta.
 */
const CHLOE_GRAVATAR = "https://veg.s3.fr-par.scw.cloud/img/avatar-chloe.jpg";

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CHLOE_GRAVATAR}
            alt={article.author}
            width={30}
            height={30}
            className="vg-author-avatar-img"
            loading="lazy"
          />
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
        {/* Hero portrait fidèle WP : image entière non rognée, ratio naturel
            720x950, affichée jusqu'à 720px de large et centrée (sizes WP = 720px). */}
        <SmartImage
          src={article.heroImage?.src}
          alt={article.title}
          fit="natural"
          ratio="720 / 950"
          width={720}
          height={950}
        />
      </div>
    </header>
  );
}
