import { Placeholder } from "./Placeholder";

interface SmartImageProps {
  /** URL de l'image (bucket S3 public). Si vide/absente → fallback Placeholder. */
  src?: string;
  /** Texte alternatif (et légende du fallback). */
  alt: string;
  /** Ratio CSS de la zone image, ex. « 4 / 3 », « 16 / 9 », « 3 / 4 ». */
  ratio?: string;
  className?: string;
}

/**
 * SmartImage — affiche la vraie photo (bucket S3) quand un `src` est fourni,
 * sinon retombe sur le <Placeholder> crème. Volontairement un simple <img>
 * (pas next/image) pour éviter toute config de domaine. Conserve l'API
 * `alt` + `ratio` + `className` du Placeholder pour un remplacement transparent.
 */
export function SmartImage({
  src,
  alt,
  ratio = "4 / 3",
  className = "",
}: SmartImageProps) {
  if (!src) {
    return <Placeholder alt={alt} ratio={ratio} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full overflow-hidden rounded-2xl object-cover ${className}`}
      style={{ aspectRatio: ratio }}
    />
  );
}
