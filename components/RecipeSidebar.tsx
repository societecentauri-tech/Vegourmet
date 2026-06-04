import Link from "next/link";
import { BlogueuseCta } from "./BlogueuseCta";
import { SmartImage } from "./SmartImage";

const CHLOE_PHOTO = "https://veg.s3.fr-par.scw.cloud/about/chloe-salon.jpg";

/**
 * Sidebar des pages recette/article (widget « À propos de moi » du thème).
 * Photo de Chloé + courte présentation + encart d'invitation.
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
            ratio="4 / 3"
          />
        </div>
        <p className="vg-widget-about-text">
          Moi c'est Chloé, créatrice de Vegourmet. Je partage des recettes vegan
          simples et gourmandes pour prouver qu'on peut se régaler sans produits
          animaux, sans se prendre la tête.
        </p>
        <Link href="/a-propos" className="vg-widget-about-link">
          En savoir plus sur moi →
        </Link>
      </div>

      <BlogueuseCta />

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
