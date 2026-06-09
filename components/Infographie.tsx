import { SmartImage } from "./SmartImage";

interface InfographieProps {
  /** Titre de l'infographie (légende). */
  title: string;
  /** Texte alternatif pour l'accessibilité. */
  alt: string;
  /** URL de l'image (bucket S3). */
  image: string;
}

/**
 * Infographie — bloc visuel infographique pour les articles guides.
 * Affiche une image pleine largeur avec une légende centrée sous l'image.
 */
export function Infographie({ title, alt, image }: InfographieProps) {
  return (
    <figure className="vg-infographie">
      <SmartImage src={image} alt={alt} ratio="16 / 9" className="vg-infographie__img" />
      {title && (
        <figcaption className="vg-infographie__caption">{title}</figcaption>
      )}
    </figure>
  );
}
