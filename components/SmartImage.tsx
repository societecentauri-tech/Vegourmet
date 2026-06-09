import Image from "next/image";
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
  /** Largeur intrinsèque (px) — posée sur l'image pour limiter le CLS. */
  width?: number;
  /** Hauteur intrinsèque (px) — posée sur l'image pour limiter le CLS. */
  height?: number;
  /**
   * Image critique (hero LCP) : désactive le lazy-loading, ajoute
   * `fetchpriority="high"` et un <link rel="preload"> automatique.
   * À réserver à UNE image au-dessus de la ligne de flottaison.
   */
  priority?: boolean;
  /**
   * Indice `sizes` pour le `srcset` responsive. Par défaut adapté aux héros
   * portrait (max ~724px de large, pleine largeur sur petit écran).
   */
  sizes?: string;
}

/**
 * SmartImage — affiche la vraie photo (bucket S3) via `next/image` (AVIF/WebP
 * auto, `srcset` responsive, lazy par défaut) quand un `src` est fourni, sinon
 * retombe sur le <Placeholder> crème. Conserve l'API `alt` + `ratio` +
 * `className` du Placeholder pour un remplacement transparent.
 *
 * Le domaine S3 `veg.s3.fr-par.scw.cloud` est autorisé dans next.config.ts
 * (images.remotePatterns), ce qui active l'Image Optimization API.
 */
export function SmartImage({
  src,
  alt,
  ratio = "4 / 3",
  className = "",
  fit = "cover",
  width,
  height,
  priority = false,
  sizes,
}: SmartImageProps) {
  if (!src) {
    return <Placeholder alt={alt} ratio={ratio} className={className} />;
  }

  // `next/image` exige width + height (ou fill). Si absents :
  //  - mode "cover" (cartes/vignettes) : on synthétise des dimensions à partir
  //    du `ratio` CSS (ex. « 4 / 3 » → 1200×900). L'`aspect-ratio` + object-cover
  //    du CSS pilotent le rendu réel ; les dims ne servent qu'au calcul du
  //    `srcset` responsive (l'image est quand même redimensionnée/convertie).
  //  - mode "natural" sans dims (cas théorique) : <img> brut, rendu garanti.
  if ((!width || !height) && fit === "cover") {
    const [rw, rh] = ratio.split("/").map((n) => Number(n.trim()));
    const baseW = 1200;
    const synthW = Number.isFinite(rw) && rw > 0 ? baseW : 1200;
    const synthH =
      Number.isFinite(rw) && Number.isFinite(rh) && rw > 0
        ? Math.round((baseW * rh) / rw)
        : 900;
    return (
      <Image
        src={src}
        alt={alt}
        width={synthW}
        height={synthH}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes ?? "(max-width: 768px) 100vw, 400px"}
        className={`w-full overflow-hidden rounded-2xl object-cover ${className}`}
        style={{ aspectRatio: ratio }}
      />
    );
  }

  if (!width || !height) {
    // Mode "natural" sans dims explicites : on synthétise width/height depuis le ratio
    // pour fournir un aspect-ratio anti-CLS et rester compatible next/image.
    const [rw, rh] = ratio.split("/").map((n) => Number(n.trim()));
    const synthW = 1200;
    const synthH =
      Number.isFinite(rw) && Number.isFinite(rh) && rw > 0
        ? Math.round((synthW * rh) / rw)
        : 900;
    return (
      <Image
        src={src}
        alt={alt}
        width={synthW}
        height={synthH}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes ?? "(max-width: 768px) 100vw, 724px"}
        className={`block h-auto w-full overflow-hidden rounded-2xl ${className}`}
      />
    );
  }

  if (fit === "natural") {
    // Image entière, ratio intrinsèque (724x1024 hero non rogné) : width/height
    // fixent le ratio (anti-CLS) ; `h-auto w-full` la laisse scaler dans sa
    // colonne (max-width imposé par le CSS parent .vg-hero / .vg-article-hero).
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes ?? "(max-width: 768px) 100vw, 724px"}
        className={`block h-auto w-full overflow-hidden rounded-2xl ${className}`}
      />
    );
  }

  // Mode "cover" : ratio imposé, recadrage object-cover dans la zone.
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      sizes={sizes ?? "(max-width: 768px) 100vw, 400px"}
      className={`w-full overflow-hidden rounded-2xl object-cover ${className}`}
      style={{ aspectRatio: ratio }}
    />
  );
}
