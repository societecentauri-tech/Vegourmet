import Image from "next/image";

// ─────────────────────────────────────────────────────────────────────────────
// Image à dimensions fixes (cartes, vignettes, logos) servie depuis le bucket S3
// `veg`. Quand la source est sur ce bucket, on passe par `next/image` (AVIF/WebP
// redimensionnée à la taille d'affichage) ; sinon (hotlink greenweez.com, etc.)
// on retombe sur un <img> brut — l'Image Optimization API n'accepte que les
// domaines listés dans next.config.ts (images.remotePatterns).
//
// Cas critique : les vignettes des blocs comparatifs guides affichent des PNG S3
// de ~1-1,2 Mio dans une boîte de 72×72 ou 120×120 px. `next/image` les sert
// alors en quelques Kio (énorme gain de poids, zéro changement visuel).
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_HOST = "veg.s3.fr-par.scw.cloud";

interface S3FixedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

function isS3(src: string): boolean {
  try {
    return new URL(src).hostname === ALLOWED_HOST;
  } catch {
    return false;
  }
}

export function S3FixedImage({
  src,
  alt,
  width,
  height,
  className,
}: S3FixedImageProps) {
  if (!isS3(src)) {
    // Hotlink hors bucket (greenweez.com…) → <img> brut, rendu garanti.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
      />
    );
  }

  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      sizes={`${width}px`}
    />
  );
}
