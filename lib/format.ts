/** Utilitaires de formatage partagés (dates, etc.). */

/**
 * Formate une date ISO (YYYY-MM-DD) en français lisible.
 * Ex : « 30 décembre 2025 »
 */
export function formatDateFr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
