import Link from "next/link";

/* Navigation principale — libellés et liens repris du <nav> réel de vegourmet.fr. */
interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/recettes",
    label: "Recettes",
    children: [
      { href: "/recette-type/petit-dejeuner-vegan", label: "Petit Déjeuner Vegan" },
      { href: "/recette-type/apero-vegan", label: "Apéro Vegan" },
      { href: "/recette-type/plat-vegan", label: "Plat Vegan" },
      { href: "/recette-type/dessert-vegan", label: "Dessert Vegan" },
      { href: "/recette-type/snack-vegan", label: "Snack Vegan" },
    ],
  },
  {
    href: "/blog",
    label: "Blog",
    children: [
      { href: "/category/guides-pratiques", label: "Guides pratiques" },
      { href: "/category/conseils-et-astuces", label: "Conseils et astuces" },
      { href: "/category/actualites-et-tendances", label: "Actualités & tendances" },
      { href: "/category/inspiration-et-lifestyle", label: "Inspiration & Lifestyle" },
    ],
  },
  { href: "/contactez-nous", label: "Contactez-nous" },
  { href: "/a-propos", label: "À propos" },
  { href: "/comment-creer-un-blog-de-cuisine-qui-cartonne", label: "Ressources" },
];

const SOCIALS = [
  { href: "https://www.facebook.com/profile.php?id=61568255593913", label: "Facebook", icon: "f" },
  { href: "https://x.com/VegourmetOff", label: "X", icon: "𝕏" },
  { href: "https://www.instagram.com/vegourmetoff/", label: "Instagram", icon: "◉" },
  { href: "https://fr.pinterest.com/vegourmetoff/", label: "Pinterest", icon: "P" },
];

/** En-tête global (port du header « style-six » du thème Yummy Bites, sticky). */
export function SiteHeader() {
  return (
    <header
      id="masthead"
      className="site-header"
      itemScope
      itemType="https://schema.org/WPHeader"
    >
      <div className="header-main">
        <div className="vg-container header-inner">
          {/* Branding : logo texte placeholder (image custom WP non téléchargée). */}
          <div className="site-branding">
            <Link
              href="/"
              className="site-logo-mark"
              aria-hidden="true"
              tabIndex={-1}
            >
              V
            </Link>
            <Link href="/" rel="home" className="site-title-tag">
              Vegourmet
            </Link>
          </div>

          <div className="menu-wrapper">
            <nav
              id="site-navigation"
              className="main-navigation desktop-nav"
              aria-label="Navigation principale"
              itemScope
              itemType="https://schema.org/SiteNavigationElement"
            >
              <ul id="primary-menu" className="nav-menu">
                {NAV_ITEMS.map((item) => (
                  <li
                    key={item.href}
                    className={
                      item.children ? "menu-item menu-item-has-children" : "menu-item"
                    }
                  >
                    <Link href={item.href}>{item.label}</Link>
                    {item.children ? (
                      <ul className="sub-menu">
                        {item.children.map((child) => (
                          <li key={child.href} className="menu-item">
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              className="header-search-toggle"
              aria-label="Rechercher"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <ul className="yummy-networks" aria-label="Réseaux sociaux">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    aria-label={s.label}
                  >
                    <span aria-hidden="true">{s.icon}</span>
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mobile-toggle"
              aria-label="Ouvrir le menu"
            >
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
