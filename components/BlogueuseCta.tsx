/**
 * BlogueuseCta — Widget « 🛠️ Secret de BLOGUEUSE » de la sidebar.
 *
 * Source de revenus d'affiliation (guide blog cuisine). À placer dans la
 * sidebar après le bloc « À propos de moi ».
 *
 * Fidélité WP (inspect.css de la source) :
 *   - conteneur : padding 15px, border #d98e73, border-radius 6px,
 *     background #fcf8f5, text-align center, box-shadow léger.
 *   - label eyebrow : 14px, color #a3a96a (olive), font-weight bold.
 *   - titre h4 : 16px, color #333.
 *   - texte : 13px, color #555 (tutoiement).
 *   - bouton : terracotta (cohérent palette vegourmet).
 *
 * Image : rapatriée sur S3 `veg.s3.fr-par.scw.cloud` (ne jamais hotlinker wp-content).
 */

const GUIDE_IMG_URL =
  "https://veg.s3.fr-par.scw.cloud/img/guide-blog-cuisine-vegan.jpg";
const GUIDE_HREF = "/comment-creer-un-blog-de-cuisine-qui-cartonne";

/** Widget sidebar « Secret de BLOGUEUSE » : guide pour créer un blog de cuisine. */
export function BlogueuseCta() {
  return (
    <div className="vg-widget vg-widget-blogueuse" aria-label="Secret de Blogueuse">
      <p className="vg-blogueuse-label">🛠️ Secret de BLOGUEUSE</p>
      <h4 className="vg-blogueuse-title">Le Secret de mon Blog à Succès</h4>
      <a
        href={GUIDE_HREF}
        className="vg-blogueuse-img-link"
        aria-label="Couverture du guide : Créer un blog de cuisine vegan"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={GUIDE_IMG_URL}
          alt="Couverture Guide Créer Blog Cuisine Vegan"
          width={70}
          className="vg-blogueuse-img"
          loading="lazy"
        />
      </a>
      <p className="vg-blogueuse-text">
        Découvre les outils exacts (Hôte, Thème, Plugins) que j'utilise pour
        Vegourmet.
      </p>
      <a href={GUIDE_HREF} className="vg-blogueuse-btn">
        Je découvre les secrets du blog
      </a>
    </div>
  );
}
