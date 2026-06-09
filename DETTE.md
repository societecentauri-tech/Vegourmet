# DETTE — Composants locaux candidats à migration upstream (centauri-ui / contracts-ui)

> POC `vegourmet-poc-migration-nextjs` (VEG) — 2026-05-29
> Auteur : 06-Gauvain (Frontend)

## Contexte

Ce POC est volontairement **hors doctrine `ds-consumption-2026`** sur un point : le
token GH Packages (`@societecentauri-tech/*`) n'est **pas accessible en
non-interactif**. Impossible donc d'installer `@societecentauri-tech/ui-web`,
`ui-native`, `tokens` ou `contracts-ui` pour ce POC.

**Décision (validée Victor)** : créer les composants éditoriaux EN LOCAL dans
`components/`, puis lister ici chaque composant comme **candidat PR upstream**.
C'est un livrable attendu du process de reprise Agence : la migration *révèle les
manques du Design System*.

### V2 (post-POC)

- Installer `@societecentauri-tech/ui-web` + `tokens` + `contracts-ui` une fois le
  token GH Packages provisionné dans Vercel (Infisical `/apps/...`).
- Remplacer chaque composant local par son équivalent DS (import direct) OU ouvrir
  la PR upstream listée ci-dessous si le composant/variante n'existe pas encore.
- Migrer les tokens vegourmet (`app/globals.css` `@theme`) vers `@societecentauri-tech/tokens`
  (theming « Plan B web »), JAMAIS en override local de classes shadcn.

## Composants locaux → candidats upstream

| Composant local | Fichier | Existe en DS ? | Action upstream |
|---|---|---|---|
| `RecipeCard` | `components/RecipeCard.tsx` | À vérifier | **PR `ui-web`** : carte recette générique (image + catégorie + temps + titre + extrait). Probablement absente — composant éditorial food spécifique. |
| `RecipeHeader` | `components/RecipeHeader.tsx` | Non | **PR `ui-web`** : en-tête recette avec bloc méta (`<dl>` temps/portions/difficulté). Réutilisable MCG + vegourmet + tout site recettes. |
| `IngredientList` | `components/IngredientList.tsx` | Non | **PR `ui-web`** : liste structurée quantité/unité/nom. Fort recouvrement avec MCG. |
| `StepList` | `components/StepList.tsx` | Non | **PR `ui-web`** : étapes numérotées avec pastilles. Réutilisable MCG. |
| `ArticleCard` | `components/ArticleCard.tsx` | Probable | **À vérifier** : une `BlogCard` / `ArticleCard` existe peut-être déjà dans `ui-web`. Si oui → import direct, suppr. local. Sinon PR. |
| `ArticleHeader` | `components/ArticleHeader.tsx` | Probable | **À vérifier** : en-tête article (catégorie + titre + chapô + date + auteur). Aligner sur l'API DS existante. |
| `Faq` | `components/Faq.tsx` | Possible | **À vérifier** : un `FAQAccordion` existe côté DS (cf. gotcha MDX inline). Si oui → import direct. Donnée toujours en frontmatter (jamais MDX inline). |
| `Breadcrumb` | `components/Breadcrumb.tsx` | **Oui (collision nom DS)** | **NE PAS forker** : `Breadcrumb` est un composant DS centauri-ui (hook `block-local-ui-fork.py`). En V2 : import direct + JSON-LD géré dans la page (pas dans le composant). |
| `Placeholder` | `components/Placeholder.tsx` | Possible | **PR `ui-web`** si absent : placeholder image ratio + alt, utile pour tout contenu à images différées (pattern reprise de site). Sinon `next/image` + blur. |
| `JsonLd` | `components/JsonLd.tsx` | Helper | Candidat `ui-shared` ou util SEO partagé (cf. lib `seo-blogposting`). Pattern déjà présent ailleurs (MCG/TOA). |
| `SiteHeader` / `SiteFooter` | `components/Site*.tsx` | Composition | Restent locaux (composition site-spécifique, nav vegourmet). Conforme « wrappers locaux acceptables » s'ils vivent dans `components/web/` en V2. |

## Variantes / tokens manquants (candidats `contracts-ui`)

- Palette vegourmet (terracotta/pêche `#e6b170` `#d98e73` `#ee9060`, olive `#a3a96a`,
  vert `#227755` `#2db68d`, encre `#453e3f`) — à exposer comme **thème** dans
  `@societecentauri-tech/tokens`, pas en override local.
- Typo : `Signika` (titres) + `PT Sans` (corps) — à enregistrer comme tokens font upstream.

## Note JSON-LD (dette SEO connue, alignée MCG)

`buildBreadcrumbJsonLd` est émis via `<JsonLd>` côté page (SSR). En V2, si le composant
DS `Breadcrumb` émet AUSSI une `BreadcrumbList` (pattern déprécié), filtrer pour éviter
le doublon Google Rich Results (cf. gotcha MCG `BreadcrumbList JSON-LD dédup`).

## Formulaire de contact Resend — gap infra (W12, à provisionner)

Route `app/api/contact/route.ts` livrée et fonctionnelle. Elle nécessite :

1. **Clé Resend** : ajouter `RESEND_API_KEY` dans Infisical `/apps/vegourmet-prod`
   (env prod), puis synchroniser dans Vercel (Settings → Environment Variables → valeur
   depuis Infisical, ou `infisical run --path=/apps/vegourmet-prod -- vercel env pull`).

2. **Domaine expéditeur vérifié dans Resend** : `vegourmet.fr` n'est probablement pas
   encore vérifié. Procédure :
   - Connexion Resend → Domains → Add Domain → `send.vegourmet.fr` (sous-domaine recommandé)
   - Ajouter les enregistrements DNS Cloudflare (TXT DKIM + MX Resend si souhaité)
   - Attendre validation Resend (~minutes), puis définir `CONTACT_FROM=contact@send.vegourmet.fr`
   - Tant que non vérifié : la variable `CONTACT_FROM` reste à `onboarding@resend.dev`
     (suffixe `[Resend]` visible → uniquement pour démonstration/test)

3. **Adresse de réception** : `CONTACT_TO` → défaut `contact@vegourmet.fr` (Google
   Workspace, DKIM actif depuis 2026-06-08). Pas d'action requise si cette adresse
   est bien en production.

**Variables à poser dans Vercel / Infisical** :
- `RESEND_API_KEY` — path : `/apps/vegourmet-prod`
- `CONTACT_FROM` — ex. `contact@send.vegourmet.fr` (après vérification Resend)
- `CONTACT_TO` — ex. `contact@vegourmet.fr` (optionnel, défaut déjà posé dans le code)

## Pattern S3 de transition dans remotePatterns (à retirer post-bascule DNS)

`next.config.ts` conserve le pattern `veg.s3.fr-par.scw.cloud` dans `remotePatterns`
(commenté `// transition-ok`) pour ne pas casser d'éventuelles URLs legacy en cache.
**À retirer** dès confirmation que le site prod ne sert plus aucune URL S3 directe
(après bascule DNS vegourmet.fr + validation en production).
Livré avec la PR `feat/veg-image-host-static` — 2026-06-09.

---

## Supabase / couche données — avis & notes (W9, livré)

Couche dynamique « avis/notes » branchée (mission W9). Instance `vegourmet_prod`
(Supabase self-host alpha) : table `public.comments` + vue `public.recipe_ratings`,
RLS service-role-only. Accès **exclusivement via BFF Next.js** (`bff-2026`) :

- `app/api/ratings/route.ts` — GET note agrégée d'une recette.
- `app/api/comments/route.ts` — GET liste paginée (approved) + POST (pending, modération).
- `lib/comments-backend.ts` — couche serveur service_role (apikey + Bearer, host direct).
- `lib/ratings.ts` + `lib/ratings-snapshot.json` — snapshot build-time (SSG) pour
  `aggregateRating` JSON-LD + note visible sur la carte recette.
  Régénéré au build par `scripts/fetch-ratings-snapshot.mjs` (`prebuild`), avec
  fallback sur le snapshot commité si l'API est injoignable (build jamais cassé).

Variables d'env (Infisical `/supabase/vegourmet-prod`, à poser dans Vercel,
server-only, jamais `NEXT_PUBLIC_`) : `COMMENTS_API_URL`, `SUPABASE_SERVICE_KEY`.
Cf. `.env.example`. Gotcha : `\n` parasite en fin de secret (le code `.trim()`).

### Dette restante sur cette couche

- **Validation manuelle** (`lib/comment-validation.ts`) au lieu de Zod, pour garder
  le build auto-suffisant sans nouvelle dépendance. Migration vers `zod` possible si
  le projet l'adopte (intégration `package.json` à coordonner).
- **Rate-limit en mémoire** (`lib/rate-limit.ts`) : best-effort, non partagé entre
  lambdas Vercel. Pour un vrai rate-limit distribué → Upstash/Redis. La modération
  (`status='pending'`) reste le rempart principal anti-spam.
- **Snapshot des notes figé au build** : la note affichée + le JSON-LD ne bougent
  qu'au redeploy (acceptable, les notes évoluent lentement). La route `/api/ratings`
  est, elle, dynamique pour un affichage temps réel si un composant en a besoin.
