import Link from "next/link";

interface QuickRecipesCtaProps {
  /** Photo hero d'une recette rapide réelle (bucket S3). Fallback géré côté CSS. */
  imageSrc?: string;
  /** Texte alternatif décrivant la photo. */
  imageAlt: string;
}

/**
 * QuickRecipesCta — CTA « Recettes vegan rapides et savoureuses » (#cta_section).
 * Section bi-colonne : titre + texte + bouton terracotta à gauche,
 * photo de recette rapide à droite.
 */
export function QuickRecipesCta({ imageSrc, imageAlt }: QuickRecipesCtaProps) {
  return (
    <section
      id="cta_section"
      className="vgh-cta"
      aria-labelledby="vgh-cta-title"
    >
      <div className="vgh-cta-grid">
        <div className="vgh-cta-text">
          <h2 id="vgh-cta-title">Recettes vegan rapides et savoureuses</h2>
          <p>
            Consultez nos dernières recettes pour vous inspirer en cuisine et
            partagez-les sur vos réseaux sociaux !
          </p>
          <Link href="/recettes" className="btn-primary">
            Découvrir les recettes
          </Link>
        </div>
        <div className="vgh-cta-media">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
