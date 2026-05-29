import Link from "next/link";
import "./listing.css";

interface PaginationProps {
  /** Page courante (1-indexée). */
  current: number;
  /** Nombre total de pages. */
  totalPages: number;
  /** Construit l'URL d'une page donnée. */
  hrefForPage: (page: number) => string;
}

/**
 * Pagination fidèle au thème (page-numbers + bouton « Suivant »).
 * Rendue uniquement si au moins 2 pages existent.
 */
export function Pagination({ current, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="vg-pagination" aria-label="Pagination">
      {pages.map((page) =>
        page === current ? (
          <span key={page} aria-current="page" className="vg-page-number is-current">
            {page}
          </span>
        ) : (
          <Link key={page} href={hrefForPage(page)} className="vg-page-number">
            {page}
          </Link>
        ),
      )}
      {current < totalPages && (
        <Link href={hrefForPage(current + 1)} className="vg-page-next">
          Suivant
        </Link>
      )}
    </nav>
  );
}
