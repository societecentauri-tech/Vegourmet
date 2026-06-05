import Link from "next/link";
import { SmartImage } from "./SmartImage";

/**
 * Photo Chloé sur le canapé — fidélité WP (widget « À propos de moi »).
 * WP affiche une grande photo pleine largeur (Chloe-sofa.jpg, ratio 3/2).
 */
const CHLOE_PHOTO = "https://veg.s3.fr-par.scw.cloud/about/chloe-sofa.jpg";

/**
 * Sidebar des pages recette/article (widget « À propos de moi » du thème).
 * Grande photo rectangulaire de Chloé fidèle au rendu WP + texte original.
 */
export function RecipeSidebar() {
  return (
    <aside className="vg-sidebar" aria-label="À propos de l'autrice">
      <div className="vg-widget vg-widget-about">
        <h2 className="vg-widget-title">À propos de moi</h2>
        <div className="vg-widget-about-photo">
          <SmartImage
            src={CHLOE_PHOTO}
            alt="Chloé, créatrice de Vegourmet"
            ratio="3 / 2"
          />
        </div>
        <p className="vg-widget-about-text">
          Je suis Chloé, passionnée de cuisine et vegan depuis 2018. Sur mon
          blog, je partage des recettes simples et gourmandes pour prouver que
          manger vegan peut être délicieux et accessible à tous.
        </p>
        <Link href="/a-propos" className="vg-widget-about-link">
          En savoir plus sur moi →
        </Link>
      </div>

      <div className="vg-widget vg-widget-cta">
        <span className="vg-widget-cta-eyebrow">La newsletter Vegourmet</span>
        <p className="vg-widget-cta-text">
          Reçois nos meilleures recettes vegan et nos astuces directement dans ta
          boîte mail.
        </p>
        <Link href="/#newsletter" className="vg-widget-cta-btn">
          Je m'inscris
        </Link>
      </div>
    </aside>
  );
}
