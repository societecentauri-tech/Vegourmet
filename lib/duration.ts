/**
 * Formatage FR des durées — module PUR (importable client + serveur).
 * Convertit les chaînes du frontmatter ("1 hour 10 minutes", "5 hrs 25 mins",
 * "10 minutes", "1 hour") en format français "1 h 10 min" / "10 min" / "1 h".
 *
 * NB : ne PAS appliquer à la source (le JSON-LD parse les chaînes brutes vers
 * ISO 8601). Usage uniquement à l'affichage.
 */
export function formatDureeFr(input?: string): string {
  if (!input) return "";
  const h = input.match(/(\d+)\s*(?:heures|heure|hours|hour|hrs|hr|h)\b/i);
  const m = input.match(/(\d+)\s*(?:minutes|minute|mins|min|m)\b/i);
  const hours = h ? parseInt(h[1], 10) : 0;
  const mins = m ? parseInt(m[1], 10) : 0;
  if (!hours && !mins) return input; // format inconnu → on garde tel quel
  if (hours && mins) return `${hours} h ${mins} min`;
  if (hours) return `${hours} h`;
  return `${mins} min`;
}
