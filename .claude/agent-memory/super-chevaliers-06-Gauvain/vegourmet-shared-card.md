---
name: vegourmet-shared-card
description: Anatomie de la carte recette partagée vegourmet (thème Yummy Bites + WP Delicious) et écart brief vs réel
metadata:
  type: project
---

La carte partagée (`components/RecipeGrid.tsx` → `ItemCard`, CSS `components/listing.css`) reproduit le `dr-archive-single` / `post-thumbnail` réel de vegourmet.fr.

Anatomie réelle (cf. `.reference/html/listing.html` + `home.html`) :
- Image portrait **3/4** (450×600 / 278×370).
- Pastille ronde catégorie **35-38px** posée au **bas-centre** de l'image (`position:absolute; bottom:0; left:50%; transform:translateX(-50%)`), couleur de catégorie + glyphe blanc centré. PAS top-left. Le `cat-name` est une infobulle au survol sous la pastille.
- Titre **centré** (Signika 700, ~1em / line-height 1.625).
- Méta centrée : temps (⏱) + difficulté (📊), gap 20px.
- **Pas d'extrait, pas de note/rating** sur la carte d'archive ni la carte favoris.

**Écart brief vs réel** : le brief décrivait pastille top-left + extrait + note étoile. C'est en réalité la carte **bannière/hero home** (`banner-slider`, `app/page.tsx`, hors périmètre) qui porte extrait + rating 4.x. La carte partagée (listings/taxos/favoris) n'a ni extrait ni note. J'ai suivi le HTML réel (objectif pixel-perfect).

**Couleurs catégories attestées** : Plat Vegan `#8a5a44`, Apéro Vegan `#d96f54`, Actualités/Inspiration `#6d9f8b`, pastilles thématiques gold `#e6b170`. Mapping complet dans `lib/categoryStyle.ts` (couleur + glyphe).

**Carte blog réelle** (`article.post` > `figure.post-thumbnail` + `content-wrapper`) est en fait différente : gauche, label catégorie texte coloré, h3, date "Modifié le". Le brief demande d'unifier sur la carte recette partagée → fait. Écart résiduel assumé.

Les articles ont bien `heroImage.src` (frontmatter MDX) pointant sur le bucket S3 `veg.s3.fr-par.scw.cloud/hero/<slug>.jpg` (HTTP 200 vérifié). Pas de placeholder si le composant lit `heroImage?.src`.
