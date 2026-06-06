/**
 * Recettes mises en avant dans le carrousel hero de la home.
 *
 * Sélection = les recettes qui génèrent le plus de CLICS Google sur les
 * 60 DERNIERS JOURS (trafic récent, signal frais), et NON plus l'agrégat
 * 16 mois. On capte ainsi la saisonnalité (recettes de saison qui montent)
 * plutôt qu'un historique figé.
 *
 * Source : Google Search Console — appel LIVE `searchanalytics.query`
 *          (API Search Console v1), dimension ["page"], propriété
 *          `https://vegourmet.fr/` (URL-prefix). Requête exécutée via le
 *          serveur MCP « google-seo » (tool `gsc_search_analytics`).
 *
 * Fenêtre de dates (aujourd'hui − 62 j → aujourd'hui − 2 j, lag GSC inclus) :
 *          startDate = 2026-04-05  →  endDate = 2026-06-04  (≈ 60 jours)
 *          Requête datée du 2026-06-06. Métrique de tri : clics décroissants
 *          (impressions en départage). 206 pages remontées.
 *
 * Méthode : chaque URL GSC (`https://vegourmet.fr/recettes/<slug>/`) est mappée
 * vers un slug = dernier segment de chemin ; on ne garde que les pages
 * /recettes/ correspondant à un .mdx avec une heroImage ; tri par clics 60 j
 * desc ; top 5. Les pages guides/articles (hors /recettes/) sont exclues même
 * si elles rankent (ex. la page « meilleure-margarine » : 165 clics).
 *
 * Top 5 retenu (slug — clics 60 j — impressions 60 j) :
 *   1. galette-de-sarrasin-vegan-recette-breteonne   — 698 clics — 4857 imp.
 *   2. cake-aux-legumes-vegan-recette-parfaite        — 265 clics — 3645 imp.
 *   3. cake-aux-olives-vegan-meilleure-recette        — 215 clics — 1534 imp.
 *   4. mascarpone-vegan-recette-star-desserts         — 180 clics — 2207 imp.
 *   5. courgette-farcie-vegan-recette-facile          — 174 clics — 1646 imp.
 *
 * POUR RAFRAÎCHIR cette liste plus tard :
 *   1. Recalculer la fenêtre : startDate = aujourd'hui − 62 j,
 *      endDate = aujourd'hui − 2 j (lag GSC).
 *   2. Appeler `searchanalytics.query` LIVE (tool MCP `gsc_search_analytics`),
 *      siteUrl `https://vegourmet.fr/`, dimensions ["page"], rowLimit 250+,
 *      tri clics desc.
 *   3. Mapper chaque URL → dernier segment de chemin = slug.
 *   4. Ne garder que les slugs présents dans content/recettes/*.mdx avec heroImage.
 *   5. Trier par clics desc (impressions en départage), prendre le top 5.
 *   6. Remplacer le tableau ci-dessous (ordre = classement) + ce commentaire.
 * (Le carrousel respecte l'ordre du tableau ; un slug absent est ignoré
 *  proprement par le fallback côté app/page.tsx — le build ne casse pas.)
 */
export const HERO_CAROUSEL_SLUGS: readonly string[] = [
  "galette-de-sarrasin-vegan-recette-breteonne",
  "cake-aux-legumes-vegan-recette-parfaite",
  "cake-aux-olives-vegan-meilleure-recette",
  "mascarpone-vegan-recette-star-desserts",
  "courgette-farcie-vegan-recette-facile",
] as const;
