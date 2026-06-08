import Image from "next/image";
import type { ImgHTMLAttributes } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Image du corps éditorial MDX (mapping `img` de MDXRemote).
//
// Objectif : remplacer les <img> bruts (PNG/WebP pleine résolution servis sans
// redimensionnement, jusqu'à ~1,2 Mio pièce) par `next/image`, qui génère un
// `srcset` AVIF/WebP redimensionné. C'est le plus gros levier de poids des pages
// recette/guide (≈3,2 Mio de PNG + ≈3,7 Mio de WebP non redimensionnées).
//
// Les images MDX n'embarquent PAS leurs dimensions (markdown `![alt](url)`).
// On suit le pattern officiel Next.js pour images distantes de taille inconnue :
//   width/height = ratio indicatif (réservation d'espace) + style width:100% /
//   height:auto (le vrai ratio l'emporte au chargement → pas de distorsion).
// `sizes` borné à la largeur de la colonne de contenu (~760px desktop).
// Lazy par défaut (ces images sont sous la ligne de flottaison).
//
// ⚠️ Seules les images du bucket S3 `veg` sont autorisées par next.config.ts.
//    Toute URL hors de ce domaine retombe sur un <img> brut pour ne rien casser.
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_HOST = "veg.s3.fr-par.scw.cloud";

/** Ratio portrait typique des photos éditoriales WP (1587×2245 ≈ 0,707). */
const DEFAULT_W = 760;
const DEFAULT_H = 1075;

function isOptimizable(src: string | undefined): src is string {
  if (!src) return false;
  try {
    return new URL(src).hostname === ALLOWED_HOST;
  } catch {
    return false;
  }
}

export function MdxImage({
  src,
  alt = "",
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const srcStr = typeof src === "string" ? src : undefined;

  if (!isOptimizable(srcStr)) {
    // Domaine non autorisé / src absente → <img> brut (sécurité de rendu).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" decoding="async" {...rest} />;
  }

  return (
    <Image
      src={srcStr}
      alt={alt}
      width={DEFAULT_W}
      height={DEFAULT_H}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 760px"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
