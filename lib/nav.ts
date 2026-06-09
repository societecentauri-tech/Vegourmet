/** Navigation principale — libellés et liens repris du <nav> réel de vegourmet.fr.
 *  Donnée pure, partagée entre le header serveur et le menu mobile client. */
export interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/recettes/",
    label: "Recettes",
    children: [
      { href: "/recette-type/petit-dejeuner-vegan/", label: "Petit Déjeuner Vegan" },
      { href: "/recette-type/apero-vegan/", label: "Apéro Vegan" },
      { href: "/recette-type/plat-vegan/", label: "Plat Vegan" },
      { href: "/recette-type/dessert-vegan/", label: "Dessert Vegan" },
      { href: "/recette-type/snack-vegan/", label: "Snack Vegan" },
    ],
  },
  {
    href: "/blog/",
    label: "Blog",
    children: [
      { href: "/category/guides-pratiques/", label: "Guides pratiques" },
      { href: "/category/conseils-et-astuces/", label: "Conseils et astuces" },
      { href: "/category/actualites-et-tendances/", label: "Actualités & tendances" },
      { href: "/category/inspiration-et-lifestyle/", label: "Inspiration & Lifestyle" },
    ],
  },
  { href: "/contactez-nous/", label: "Contactez-nous" },
  { href: "/a-propos/", label: "À propos" },
];
