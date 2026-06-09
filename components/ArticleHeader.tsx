import Link from "next/link";
import type { ArticleFrontmatter } from "@/lib/types";
import { getCategoryColor, getCategoryHref } from "@/lib/categoryStyle";
import { buildDateDisplay, formatDateFr } from "@/lib/format";
import { SmartImage } from "./SmartImage";
import Image from "next/image";
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
  const dateDisplay = buildDateDisplay(
    article.datePublished,
    article.dateModified,
  );

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
          <Image
            src={CHLOE_GRAVATAR}
            alt={article.author}
            width={40}
            height={40}
            className="vg-author-avatar-img"
          />
          {article.author}
        </span>
        <span className="vg-dot" title={dateDisplay.tooltip}>
          {dateDisplay.label}{" "}
          <time dateTime={dateDisplay.dateTime}>
            {formatDateFr(dateDisplay.dateTime)}
          </time>
        </span>
        {readingTime && <span className="vg-dot">{readingTime}</span>}
      </div>

      {/* Hero : affiché uniquement si l'article a une image hero ET n'est pas noindex.
          Les pages utilitaires (contact, mentions légales…) peuvent omettre heroImage
          pour supprimer le bloc visuel sans casser la mise en page. */}
      {!article.noindex && article.heroImage?.src && (
        <div className="vg-hero">
          {/* Hero portrait fidèle WP : image entière non rognée, ratio naturel
              720x950, affichée jusqu'à 720px de large et centrée (sizes WP = 720px). */}
          <SmartImage
            src={article.heroImage.src}
            alt={article.title}
            fit="natural"
            ratio="720 / 950"
            width={720}
            height={950}
            priority
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      )}
    </header>
  );
}
