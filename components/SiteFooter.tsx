import Link from "next/link";
import { CookieManageLink } from "./CookieManageLink";

/* Menus du footer — liens repris des widgets de colophon de vegourmet.fr. */
const LIENS_UTILES = [
  { href: "/recette-type/petit-dejeuner-vegan/", label: "Petit Déjeuner Vegan" },
  { href: "/recette-type/apero-vegan/", label: "Apéro Vegan" },
  { href: "/recette-type/plat-vegan/", label: "Plat Vegan" },
  { href: "/recette-type/dessert-vegan/", label: "Dessert Vegan" },
  { href: "/recette-type/snack-vegan/", label: "Snack Vegan" },
];

const ACCES_RAPIDE = [
  { href: "/recettes/", label: "Recettes" },
  { href: "/blog/", label: "Blog" },
  { href: "/contactez-nous/", label: "Contactez-nous" },
  { href: "/a-propos/", label: "À propos" },
];

const SUIVEZ_NOUS = [
  { href: "https://www.facebook.com/profile.php?id=61568255593913", label: "Facebook" },
  { href: "https://x.com/VegourmetOff", label: "Twitter" },
  { href: "https://www.instagram.com/vegourmetoff/", label: "Instagram" },
  { href: "https://fr.pinterest.com/vegourmetoff/", label: "Pinterest" },
];

/** Pied de page global (port du colophon « site-footer » du thème Yummy Bites). */
export function SiteFooter() {
  return (
    <footer
      id="colophon"
      className="site-footer"
      itemScope
      itemType="https://schema.org/WPFooter"
    >
      <div className="footer-t">
        <div className="vg-container">
          <div className="footer-grid grid column-4">
            <div className="col">
              <div className="widget widget_media_image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo-vegourmet.png"
                  width={500}
                  height={159}
                  className="footer-logo"
                  alt="Vegourmet"
                />
              </div>
              <p>
                Vegourmet est un blog culinaire proposant des recettes vegan
                délicieuses et faciles à suivre pour toutes les occasions, du
                petit-déjeuner au dîner. Ce blog est une excellente ressource
                pour les cuisiniers en quête d&apos;inspiration pour sublimer la
                cuisine vegan.
              </p>
            </div>

            <div className="col">
              <section className="widget widget_nav_menu">
                <h2 className="widget-title">Liens utiles</h2>
                <ul className="menu">
                  {LIENS_UTILES.map((item) => (
                    <li key={item.href} className="menu-item">
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="col">
              <section className="widget widget_nav_menu">
                <h2 className="widget-title">Accès rapide</h2>
                <ul className="menu">
                  {ACCES_RAPIDE.map((item) => (
                    <li key={item.href} className="menu-item">
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="col">
              <section className="widget widget_nav_menu">
                <h2 className="widget-title">Suis-nous</h2>
                <ul className="menu">
                  {SUIVEZ_NOUS.map((item) => (
                    <li key={item.href} className="menu-item">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-b">
        <div className="vg-container">
          <div className="footer-bottom-t">
            <div className="site-info">
              <span className="copyright">
                © Copyright {new Date().getFullYear()}{" "}
                <Link href="/">Vegourmet</Link>. Tous droits réservés.
              </span>
            </div>
            <nav className="footer-navigation" aria-label="Liens légaux">
              <ul className="nav-menu">
                <li>
                  <Link href="/mentions-legales-politique-de-confidentialite/">
                    Mentions Légales &amp; Politique de Confidentialité
                  </Link>
                </li>
                <li>
                  <CookieManageLink />
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="footer-disclosure">
        <div className="vg-container">
          <p>
            <strong>Affiliation :</strong> Certains articles contiennent des
            liens d&apos;affiliation.
          </p>
        </div>
      </div>
    </footer>
  );
}
