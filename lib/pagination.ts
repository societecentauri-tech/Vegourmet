/** Pagination serveur des listings (recettes, blog, taxonomies). */

export const PAGE_SIZE = 12;

export interface Paginated<T> {
  pageItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** Normalise le paramètre `?page=` et découpe la liste. */
export function paginate<T>(items: T[], rawPage: unknown): Paginated<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const n = Number.parseInt(String(rawPage ?? "1"), 10);
  const currentPage = Number.isFinite(n) ? Math.min(Math.max(1, n), totalPages) : 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    pageItems: items.slice(start, start + PAGE_SIZE),
    currentPage,
    totalPages,
    totalItems,
  };
}

/** Construit l'URL d'une page (page 1 = chemin nu, sinon ?page=N). */
export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
