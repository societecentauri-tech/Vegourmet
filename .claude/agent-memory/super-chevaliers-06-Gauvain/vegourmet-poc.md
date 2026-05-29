---
name: vegourmet-poc
description: Repo vegourmet.fr (POC Next.js 16) — structure, thème Yummy Bites, conventions templates article/listing
metadata:
  type: project
---

POC vegourmet.fr (site WordPress racheté, refait en Next.js 16 App Router + Tailwind v4 + MDX).
**Why:** Victor veut un rendu PIXEL-PERFECT du vrai site (thème « Yummy Bites » + plugin WP Delicious).
**How to apply:** travailler depuis les HTML de référence dans `.reference/html/` (CSS inliné), pas de Playwright.

Tokens palette (globals.css, NE PAS éditer) : peach #e6b170 (=gold), terracotta #d98e73, olive #a3a96a, green #227755, ink #453e3f, cream #f7f3f0. Fonts Signika (titres) + PT Sans (corps) chargées globalement. Vars runtime alternatives : --vg-bg/--vg-terracotta/--vg-gold/--vg-ink/--vg-title/--vg-cat/--vg-cat2.

Structure thème réel :
- **Article** (`.reference/html/article.html`) : PAS de breadcrumb ni TOC. `entry-header` = pastille cat-links colorée (var --yummy-category-color) + H1 entry-title + méta (auteur avatar + « Modifié le <date> » + read-time) ; post-thumbnail hero ; entry-content avec panels `vegourmet-panel-primary/secondary` + `vegourmet-blockquote-styled` ; FAQ `dr-faqs-section-blog` ; related « Vous aimerez peut-être aussi... ».
- **Listing/taxo** (`.reference/html/listing.html`) : PAS de H1 visible dans le thème (titre seulement dans <title>). Grille `dr-archive-list-gridwrap grid` 3→2 cols. Carte `dr-archive-single` : image portrait 3/4, pastille catégorie ronde dorée (#e6b170) en haut-gauche avec tooltip cat-name au hover, titre centré, méta temps+difficulté. Pagination `page-numbers` + « Suivant ».

Couleurs catégorie (var --yummy-category-color) : « Actualités & tendances » → #6d9f8b. ATTENTION slugifyTaxo collapse le `&` : « Actualités & tendances » → `actualites-tendances` (pas `-et-`).

Mes composants livrés (préfixe CSS `.vg-`, scopés via `components/article.css` + `components/listing.css`) :
RecipeGrid.tsx (ItemCard + recipeToListingItem/articleToListingItem), ListingHeader.tsx, Pagination.tsx, ArticleHeader.tsx, ArticleFaq.tsx, RelatedArticles.tsx, MdxContent.tsx. Helpers lib/categoryStyle.ts + getReadingTime/getRelatedArticles dans lib/content.ts.

Cast TS pour CSS custom property : `style={{ ["--vg-cat-color" as string]: color }}`.
