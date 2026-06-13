/**
 * Slugification de taxonomie — module PUR (aucune dépendance Node/fs),
 * donc importable côté client comme côté serveur.
 * Extrait de lib/content.ts pour éviter d'embarquer `node:fs` dans le bundle
 * navigateur via la chaîne categoryStyle → content.
 */
export function slugifyTaxo(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
