/**
 * Déclarations de types globaux pour GA4 / gtag.js.
 *
 * Évite tout recours à `any` tout en permettant l'injection manuelle de
 * window.gtag via document.createElement dans Analytics.tsx.
 */

// Les arguments acceptés par window.gtag sont variés — on utilise un tuple
// ouvert pour conserver la compatibilité avec l'API gtag officielle.
type GtagArgs = [string, ...unknown[]];

interface Window {
  // eslint-disable-next-line no-unused-vars
  gtag: (...args: GtagArgs) => void;
  dataLayer: unknown[];
}
