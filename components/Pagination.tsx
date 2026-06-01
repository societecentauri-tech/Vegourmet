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

/** Numéros à afficher avec ellipses : 1 … n-1 n n+1 … last (fenêtre compacte). */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_v, i) => i + 1);
  const out: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push("…");
  for (let p = left; p <= right; p++) out.push(p);
  if (right < total - 1) out.push("…");
  out.push(total);
  return out;
}

/**
 * Pagination fidèle au thème (page-numbers + bouton « Suivant »).
 * Rendue uniquement si au moins 2 pages existent. Ellipses au-delà de 7 pages.
 */
export function Pagination({ current, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="vg-pagination" aria-label="Pagination">
      {pageList(current, totalPages).map((page, i) =>
        page === "…" ? (
          <span key={`gap-${i}`} className="vg-page-gap" aria-hidden="true">
            …
          </span>
        ) : page === current ? (
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
