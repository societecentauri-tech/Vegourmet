---
name: theme-vegourmet
description: Port du thème visuel vegourmet.fr (Yummy Bites + WP Delicious) en Next.js — palette, polices, classes
metadata:
  type: project
---

# Port shell visuel vegourmet.fr

Site racheté par Centauri. Source de vérité = `.reference/html/*.html` (HTML réel rendu, CSS critique inliné). Thème WP = **Yummy Bites** + plugin **WP Delicious**.

**Why:** POC pixel-perfect demandé par Victor — le rendu générique d'origine ne ressemblait pas au vrai site.

**How to apply:**
- Palette dans `:root` de `app/globals.css` : préfixe `--vg-*` (bg #f7f3f0, terracotta #d98e73 / hover #bf7052, gold #e6b170, peach #ee9060, title #2c3e50, cat #8a5a44, cat2 #d96f54, green #227755, olive #a3a96a).
- Polices via `next/font/google` dans `layout.tsx` : Signika (titres+logo, `--font-vg-title`), PT Sans (corps, `--font-vg-body`), Montserrat (secondaire/eyebrows/cats, `--font-vg-alt`).
- `@theme inline` expose `--color-vg-*` ET garde des alias rétro-compat `--color-veg-*` (RecipeCard/ArticleCard/RecipeHeader les utilisent — NE PAS casser ces alias).
- Classes thème portées : `.site-header` (sticky), `.main-navigation .nav-menu/.sub-menu` (dropdown hover), `.site-banner/.banner-grid` (hero 1 feature + 2 side), `.recipe-card` (item-title/card-cat/recipe-item-meta), `.cat-grid/.cat-tile`, `.site-footer` (footer-t 4 cols + footer-b + footer-disclosure).
- Logo = placeholder texte "Vegourmet" + pastille "V" (image custom WP non téléchargée).
- Conteneur 1200px (`.vg-container`), radius 12px.
- Périmètre Galaad : globals.css, layout.tsx, SiteHeader/SiteFooter, page.tsx. NE PAS toucher app/recettes, [slug], category, blog, components/Recipe*/Article*.
