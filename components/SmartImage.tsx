import { Placeholder } from "./Placeholder";

interface SmartImageProps {
  /** URL de l'image (bucket S3 public). Si vide/absente → fallback Placeholder. */
  src?: string;
  /** Texte alternatif (et légende du fallback). */
  alt: string;
  /** Ratio CSS de la zone image, ex. « 4 / 3 », « 16 / 9 », « 3 / 4 ». */
  ratio?: string;
  className?: string;
  /**
   * Mode de cadrage de l'image :
   * - "cover" (défaut) : recadre l'image pour remplir la zone au `ratio` imposé
   *   (object-cover + aspect-ratio). Idéal pour les vignettes/cartes à ratio fixe.
   * - "natural" : affiche l'image entière, NON rognée, à son ratio intrinsèque
   *   (height auto, aucun object-fit). Reproduit le rendu d'un <img> responsive WP.
   *   Le `ratio` n'est alors utilisé que par le fallback Placeholder.
   */
  fit?: "cover" | "natural";
  /** Largeur intrinsèque (px) — posée sur l'<img> pour limiter le CLS. */
  width?: number;
  /** Hauteur intrinsèque (px) — posée sur l'<img> pour limiter le CLS. */
  height?: number;
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
  fit = "cover",
  width,
  height,
}: SmartImageProps) {
  if (!src) {
    return <Placeholder alt={alt} ratio={ratio} className={className} />;
  }

  if (fit === "natural") {
    // Image entière, ratio intrinsèque : aucune contrainte d'aspect-ratio ni de
    // crop (comme WordPress). width/height (si fournis) donnent un ratio implicite
    // au navigateur pour réserver la place (anti-CLS) tout en gardant height auto.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={`block h-auto w-full overflow-hidden rounded-2xl ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`w-full overflow-hidden rounded-2xl object-cover ${className}`}
      style={{ aspectRatio: ratio }}
    />
  );
}
