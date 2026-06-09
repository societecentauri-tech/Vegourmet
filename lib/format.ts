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

/**
 * Construit les props d'affichage de date pour les en-têtes.
 *
 * Règle :
 * - dates égales (ou dateModified absent) → « Publié le {datePublished} »
 * - dates différentes → « Mis à jour le {dateModified} »
 *   avec un attribut title tooltip « Publié initialement le {datePublished} »
 */
export function buildDateDisplay(
  datePublished: string,
  dateModified?: string,
): {
  label: string;
  dateTime: string;
  tooltip: string | undefined;
} {
  const effective = dateModified ?? datePublished;
  const isUpdated = !!dateModified && dateModified !== datePublished;

  return {
    label: isUpdated ? "Mis à jour le" : "Publié le",
    dateTime: effective,
    tooltip: isUpdated
      ? `Publié initialement le ${formatDateFr(datePublished)}`
      : undefined,
  };
}
