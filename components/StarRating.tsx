import { StarIcon } from "./RecipeIcons";

interface StarRatingProps {
  /** Note 0–5 (peut être fractionnaire, ex. 4.9). */
  value: number;
  /** Taille des étoiles en px (déf. 16). */
  size?: number;
  /** Libellé accessible (déf. généré « 4,9 sur 5 »). */
  label?: string;
}

/**
 * Affiche 5 étoiles avec remplissage fractionnaire fidèle à `value`.
 * Rendu SSR pur (aucun JS client) : superposition d'une rangée pleine clippée
 * en largeur (value/5) au-dessus d'une rangée « vide ». Les étoiles vides
 * réutilisent le `StarIcon` du DS local avec une opacité réduite.
 */
export function StarRating({ value, size = 16, label }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;
  const frFloat = clamped.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const aria = label ?? `${frFloat} sur 5`;

  return (
    <span
      className="vg-starrating"
      role="img"
      aria-label={aria}
      style={{ ["--vg-star-size" as string]: `${size}px` }}
    >
      <span className="vg-starrating__track" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </span>
      <span
        className="vg-starrating__fill"
        aria-hidden="true"
        style={{ width: `${pct}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </span>
    </span>
  );
}
