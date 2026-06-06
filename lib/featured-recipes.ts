/**
 * Recettes mises en avant dans le carrousel hero de la home.
 *
 * Sélection = les recettes les MIEUX classées sur Google, mesurées par les clics
 * réels (trafic), pas par la date de publication. Source : export Google Search
 * Console « by-page » couvrant 16 mois.
 *
 * Source : gsc_by-page 2025-02 → 2026-06, classé par clics décroissants
 *          (départage par impressions). Fichier d'origine :
 *          backups/vegourmet/2026-06-03/gsc-export/gsc_by-page_2025-02_2026-06.json
 *
 * Méthode : chaque URL GSC (`https://vegourmet.fr/recettes/<slug>/`) est mappée
 * vers un slug de recette ; on ne garde que les pages /recettes/ ayant une
 * heroImage ; tri par clics desc ; top 5. Les pages guides/articles (hors
 * /recettes/) sont exclues même si elles rankent (ex. la page « margarine »).
 *
 * Top 5 retenu (slug — clics — impressions sur la période) :
 *   1. guacamole-la-meilleure-recette-en-5-minutes   — 4259 clics — 133559 imp.
 *   2. galette-de-sarrasin-vegan-recette-breteonne    — 2409 clics —  19790 imp.
 *   3. muffins-sales-vegan-recette-simple-rapide      — 2378 clics —  23032 imp.
 *   4. nuggets-vegan-meilleure-recette-facon-kfc-7    — 1332 clics —  15806 imp.
 *   5. bo-bun-vegan-meilleure-recette-vietnamienne    — 1321 clics —  11910 imp.
 *
 * POUR RAFRAÎCHIR cette liste plus tard :
 *   1. Ré-exporter le rapport GSC « Pages » (≈ 16 mois) en JSON.
 *   2. Mapper chaque URL → dernier segment de chemin = slug.
 *   3. Ne garder que les slugs présents dans content/recettes/*.mdx avec heroImage.
 *   4. Trier par clics desc (impressions en départage), prendre le top 5.
 *   5. Remplacer le tableau ci-dessous (ordre = classement) + ce commentaire.
 * (Le carrousel respecte l'ordre du tableau ; un slug absent est ignoré
 *  proprement par le fallback côté app/page.tsx — le build ne casse pas.)
 */
export const HERO_CAROUSEL_SLUGS: readonly string[] = [
  "guacamole-la-meilleure-recette-en-5-minutes",
  "galette-de-sarrasin-vegan-recette-breteonne",
  "muffins-sales-vegan-recette-simple-rapide",
  "nuggets-vegan-meilleure-recette-facon-kfc-7",
  "bo-bun-vegan-meilleure-recette-vietnamienne",
] as const;
