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

/* Réseaux sociaux — icônes SVG fidèles aux <svg.tasty-icon> du header réel. */
const SOCIALS: { href: string; label: string; path: string; viewBox: string }[] = [
  {
    href: "https://www.facebook.com/profile.php?id=61568255593913",
    label: "Facebook",
    viewBox: "0 0 20 20",
    path: "M20,10.1c0-5.5-4.5-10-10-10S0,4.5,0,10.1c0,5,3.7,9.1,8.4,9.9v-7H5.9v-2.9h2.5V7.9C8.4,5.4,9.9,4,12.2,4c1.1,0,2.2,0.2,2.2,0.2v2.5h-1.3c-1.2,0-1.6,0.8-1.6,1.6v1.9h2.8L13.9,13h-2.3v7C16.3,19.2,20,15.1,20,10.1z",
  },
  {
    href: "https://x.com/VegourmetOff",
    label: "X",
    viewBox: "0 0 512 512",
    path: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z",
  },
  {
    href: "https://www.instagram.com/vegourmetoff/",
    label: "Instagram",
    viewBox: "0 0 256 256",
    path: "M128 23.06c34.18 0 38.22.13 51.72.75 12.48.57 19.26 2.65 23.77 4.41 5.97 2.32 10.24 5.09 14.72 9.57 4.48 4.48 7.25 8.74 9.57 14.72 1.75 4.51 3.84 11.29 4.41 23.77.62 13.5.75 17.54.75 51.72s-.13 38.22-.75 51.72c-.57 12.48-2.66 19.26-4.41 23.77-2.32 5.97-5.09 10.24-9.57 14.72-4.48 4.48-8.74 7.25-14.72 9.57-4.51 1.75-11.29 3.84-23.77 4.41-13.5.62-17.54.75-51.72.75s-38.22-.13-51.72-.75c-12.48-.57-19.26-2.66-23.77-4.41-5.97-2.32-10.24-5.09-14.72-9.57-4.48-4.48-7.25-8.74-9.57-14.72-1.75-4.51-3.84-11.29-4.41-23.77-.62-13.5-.75-17.54-.75-51.72s.13-38.22.75-51.72c.57-12.48 2.66-19.26 4.41-23.77 2.32-5.97 5.09-10.24 9.57-14.72 4.48-4.48 8.74-7.25 14.72-9.57 4.51-1.76 11.29-3.84 23.77-4.41 13.5-.62 17.54-.75 51.72-.75zM128 0C93.24 0 88.88.15 75.23.77 61.6 1.39 52.3 3.56 44.15 6.72c-8.42 3.27-15.56 7.65-22.67 14.76C14.37 28.6 9.99 35.74 6.72 44.16c-3.16 8.14-5.33 17.44-5.95 31.07C.15 88.88 0 93.24 0 128s.15 39.12.77 52.77c.62 13.62 2.79 22.93 5.95 31.07 3.27 8.42 7.65 15.56 14.76 22.67 7.12 7.12 14.26 11.49 22.67 14.76 8.14 3.16 17.44 5.33 31.07 5.95C88.88 255.85 93.24 256 128 256s39.12-.15 52.77-.77c13.62-.62 22.93-2.79 31.07-5.95 8.42-3.27 15.56-7.65 22.67-14.76 7.12-7.12 11.49-14.26 14.76-22.67 3.16-8.14 5.33-17.44 5.95-31.07.62-13.65.77-18.01.77-52.77s-.15-39.12-.77-52.77c-.62-13.62-2.79-22.93-5.95-31.07-3.27-8.42-7.65-15.56-14.76-22.67C227.4 14.37 220.26 9.99 211.84 6.72c-8.14-3.16-17.44-5.33-31.07-5.95C167.12.15 162.76 0 128 0zm0 62.27c-36.3 0-65.73 29.43-65.73 65.73s29.43 65.73 65.73 65.73 65.73-29.43 65.73-65.73S164.3 62.27 128 62.27zm0 108.4c-23.56 0-42.67-19.1-42.67-42.67S104.44 85.33 128 85.33s42.67 19.1 42.67 42.67-19.1 42.67-42.67 42.67zm83.69-110.99c0 8.48-6.88 15.36-15.36 15.36s-15.36-6.88-15.36-15.36 6.88-15.36 15.36-15.36 15.36 6.88 15.36 15.36z",
  },
  {
    href: "https://fr.pinterest.com/vegourmetoff/",
    label: "Pinterest",
    viewBox: "0 0 20 20",
    path: "M10,0C4.5,0,0,4.5,0,10c0,4.1,2.5,7.6,6,9.2c0-0.7,0-1.5,0.2-2.3c0.2-0.8,1.3-5.4,1.3-5.4s-0.3-0.6-0.3-1.6c0-1.5,0.9-2.6,1.9-2.6c0.9,0,1.3,0.7,1.3,1.5c0,0.9-0.6,2.3-0.9,3.5c-0.3,1.1,0.5,1.9,1.6,1.9c1.9,0,3.2-2.4,3.2-5.3c0-2.2-1.5-3.8-4.2-3.8c-3,0-4.9,2.3-4.9,4.8c0,0.9,0.3,1.5,0.7,2C6,12,6.1,12.1,6,12.4c0,0.2-0.2,0.6-0.2,0.8c-0.1,0.3-0.3,0.3-0.5,0.3c-1.4-0.6-2-2.1-2-3.8c0-2.8,2.4-6.2,7.1-6.2c3.8,0,6.3,2.8,6.3,5.7c0,3.9-2.2,6.9-5.4,6.9c-1.1,0-2.1-0.6-2.4-1.2c0,0-0.6,2.3-0.7,2.7c-0.2,0.8-0.6,1.5-1,2.1C8.1,19.9,9,20,10,20c5.5,0,10-4.5,10-10C20,4.5,15.5,0,10,0z",
  },
];

/** En-tête global (port du header « style-six » du thème Yummy Bites, sticky). */
export function SiteHeader() {
  return (
    <header
      id="masthead"
      className="site-header style-six"
      itemScope
      itemType="https://schema.org/WPHeader"
    >
      <div className="header-main">
        <div className="vg-container header-inner">
          {/* Branding : logo image officiel cropped-Logo-Vegourmet-Header. */}
          <div className="site-branding">
            <Link href="/" rel="home" className="custom-logo-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-vegourmet.png"
                width={500}
                height={159}
                className="custom-logo"
                alt="Vegourmet"
                fetchPriority="high"
              />
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

            <div className="header-search">
              <button
                type="button"
                className="search-toggle"
                aria-label="Rechercher"
                aria-expanded="false"
              >
                <svg
                  width="21"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M9.83325 16.6667C13.9754 16.6667 17.3333 13.3089 17.3333 9.16675C17.3333 5.02461 13.9754 1.66675 9.83325 1.66675C5.69112 1.66675 2.33325 5.02461 2.33325 9.16675C2.33325 13.3089 5.69112 16.6667 9.83325 16.6667Z"
                    stroke="inherit"
                    fill="none"
                    strokeOpacity="0.9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.1665 17.5L15.6665 15"
                    stroke="inherit"
                    fill="none"
                    strokeOpacity="0.9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="header-social">
              <ul className="yummy-networks" aria-label="Réseaux sociaux">
                {SOCIALS.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      aria-label={s.label}
                    >
                      <svg
                        className="tasty-icon"
                        width="18"
                        height="18"
                        viewBox={s.viewBox}
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d={s.path} fill="currentColor" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

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
