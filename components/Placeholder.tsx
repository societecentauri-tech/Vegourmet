interface PlaceholderProps {
  /** Texte alternatif (réutilisé comme légende visible du placeholder). */
  alt: string;
  /** Ratio CSS de la zone image, ex. « 4 / 3 », « 16 / 9 », « 3 / 4 ». */
  ratio?: string;
  className?: string;
}

/**
 * Placeholder image — POC : aucune image n'est téléchargée (cf. images-manifest.json).
 * Affiche un bloc dégradé crème/olive avec le alt et le ratio.
 * Le `src` réel sera branché plus tard via bucket S3.
 */
export function Placeholder({ alt, ratio = "4 / 3", className = "" }: PlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-veg-cream-soft bg-gradient-to-br from-veg-cream to-veg-olive/20 text-center ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <span className="px-4 py-2 text-sm font-medium text-veg-ink/70">
        {alt}
        <span className="mt-1 block text-xs text-veg-muted">
          Image différée · {ratio.replace(/\s/g, "")}
        </span>
      </span>
    </div>
  );
}
