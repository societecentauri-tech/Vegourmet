import Link from "next/link";
import { BlogueuseCta } from "./BlogueuseCta";

/** Avatar Gravatar rapatrié sur S3 (160×160 PNG, fidélité WP). */
const CHLOE_AVATAR = "https://veg.s3.fr-par.scw.cloud/img/avatar-chloe.jpg";

/**
 * Sidebar des pages recette/article (widget « À propos de moi » du thème).
 * Avatar Chloé circulaire (Gravatar WP rapatrié sur S3) + texte original WP.
 */
export function RecipeSidebar() {
  return (
    <aside className="vg-sidebar" aria-label="À propos de l'autrice">
      <div className="vg-widget vg-widget-about">
        <h2 className="vg-widget-title">À propos de moi</h2>
        <div className="vg-widget-about-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CHLOE_AVATAR}
            alt="Chloé"
            width={80}
            height={80}
            className="vg-widget-about-avatar-img"
            loading="lazy"
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
