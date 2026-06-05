# Vegourmet — POC migration Next.js 16

POC de reprise du blog WordPress **vegourmet.fr** (recettes vegan) vers la stack
Centauri **Next.js 16 + TypeScript strict + Tailwind CSS v4 + MDX**.

Mission : `vegourmet-poc-migration-nextjs` (VEG).

## Objectif

Prouver qu'on peut absorber un site existant **sans recréer de pipeline** et en
**préservant la structure d'URL à l'identique** (enjeu SEO central d'une reprise).

## Stack

- Next.js 16 (App Router, routes statiques au build)
- TypeScript strict (zéro `any`)
- Tailwind CSS v4 (`@theme` inline, tokens vegourmet extraits du site réel)
- MDX via `next-mdx-remote/rsc` + `gray-matter` (frontmatter)
- Pages recettes/articles : statiques (SSG). Couche dynamique « avis/notes »
  branchée via routes BFF Next.js (`app/api/*`) sur Supabase `vegourmet_prod`
  (service_role server-only) — cf. section « Avis / notes » et `DETTE.md`.

## Structure d'URL (préservée à l'identique)

| Route Next.js | Source vegourmet.fr |
|---|---|
| `/` | homepage |
| `/recettes` | index recettes |
| `/recettes/[slug]` | détail recette |
| `/[slug]` | article/guide racine |
| `/blog` | index articles |
| `/recette-type/[slug]` · `/recette-style/[slug]` · `/recette-thematique/[slug]` · `/category/[slug]` | taxonomies |

## Contenu

- `content/recettes/*.mdx` — 10 recettes (contenu réel fetché)
- `content/blog/*.mdx` — 5 articles/guides (contenu réel fetché)

## Images

Différées : aucune image téléchargée. Voir `images-manifest.json` (24 entrées) ;
le site affiche un `<Placeholder>` ratio + alt. Le `src` réel sera branché via S3.

## SEO

- JSON-LD `Recipe` sur chaque recette (corrige le P0 « Recipe absent » du WordPress)
- JSON-LD `aggregateRating` (vraie note, vue `recipe_ratings`) **uniquement** sur les
  recettes notées (`ratingCount > 0`) — jamais sur une recette à 0 note
- JSON-LD `Article` + `BreadcrumbList` sur les articles
- `<link rel="canonical">` = URL vegourmet.fr correspondante
- `sitemap.ts` + `robots.ts`

## Avis / notes (couche dynamique)

Branchée sur Supabase `vegourmet_prod` via **routes BFF** (aucun accès client direct) :

| Route | Rôle |
|---|---|
| `GET /api/ratings?slug=` | note agrégée d'une recette (`recipe_ratings`) |
| `GET /api/comments?slug=&page=N` | avis approuvés, paginés (`created_at` desc) |
| `POST /api/comments` | nouvel avis → `status='pending'` (modération) |

- La **vraie note** (étoiles + nb d'avis) est affichée sur la carte recette et figée
  au build via `lib/ratings-snapshot.json` (généré par `scripts/fetch-ratings-snapshot.mjs`,
  hook `prebuild`) — fallback sur le snapshot commité si l'API est injoignable au build.
- L'`author_email_hash` n'est **jamais** exposé.

### Variables d'environnement (Vercel, server-only)

Depuis Infisical `/supabase/vegourmet-prod` (cf. `.env.example`) :

| Variable | Valeur |
|---|---|
| `COMMENTS_API_URL` | `https://vegourmet.alpha.cntri.cloud` (host direct, pas un `api.*` proxifié) |
| `SUPABASE_SERVICE_KEY` | clé `service_role` — **jamais** `NEXT_PUBLIC_`. Gotcha : `\n` parasite en fin de secret (le code `.trim()`) |

## Commandes

```bash
npm install
npm run dev               # http://localhost:3000
npm run ratings:snapshot  # régénère lib/ratings-snapshot.json (nécessite SUPABASE_SERVICE_KEY)
npm run build             # build (prebuild = refresh snapshot, fallback si API KO)
npm run typecheck         # tsc --noEmit
```
