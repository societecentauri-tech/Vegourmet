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
- 100 % statique — aucune instance Supabase (cf. `DETTE.md`)

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
- JSON-LD `Article` + `BreadcrumbList` sur les articles
- `<link rel="canonical">` = URL vegourmet.fr correspondante
- `sitemap.ts` + `robots.ts`

## Commandes

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build statique
npm run typecheck  # tsc --noEmit
```
