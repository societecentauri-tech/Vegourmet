import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Headers de sécurité + dé-indexation des déploiements non-canoniques.
//
// But P0-1 : empêcher l'indexation de vegourmet.vercel.app (duplicate content
// avec vegourmet.fr). ⚠️ VERCEL_ENV === "production" est VRAI sur l'alias
// vegourmet.vercel.app (c'est le deployment « production » du projet Vercel),
// donc une condition d'env ne suffit pas tant que le DNS vegourmet.fr pointe
// sur WordPress. La dé-indexation est donc conditionnée au HOST de la requête :
//   - host *.vercel.app  → X-Robots-Tag: noindex, nofollow (toujours, à vie)
//   - host vegourmet.fr  → indexable (prendra effet à la bascule DNS)
// On NE TOUCHE PAS aux balises canonical → vegourmet.fr, déjà émises côté pages.
// ─────────────────────────────────────────────────────────────────────────────

// CSP en mode Report-Only (P1-2) : on observe les violations sans rien casser.
// Autorise : self, fonts Google (fonts.googleapis.com / fonts.gstatic.com),
// images depuis le bucket S3 `veg` Scaleway + data: (icônes inline éventuelles).
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: https://static.vegourmet.fr",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
].join("; ");

const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Slash final — aligne les URL Next sur le format WordPress historique indexé
  // par Google (ex : /recettes/carbonara-vegan-.../ avec slash). Évite tout
  // changement d'URL au recrawl post-bascule DNS (0 redirect 308 visible par
  // Googlebot sur les URL indexées).
  // ─────────────────────────────────────────────────────────────────────────────
  trailingSlash: true,

  // ─────────────────────────────────────────────────────────────────────────────
  // Optimisation des images (poids des pages + LCP + indexation).
  //
  // Les images sont servies par le CDN `static.vegourmet.fr` (Worker Cloudflare,
  // cache 1 an, origine = bucket S3 Scaleway `veg`). On autorise ce domaine pour
  // `next/image` afin que l'Image Optimization API de Next/Vercel génère à la
  // volée des variantes AVIF/WebP redimensionnées (`srcset`/`sizes`).
  // Gains attendus sur une page recette : ~7,4 Mio d'images → ~1-1,5 Mio
  //   - conversion des PNG (≈3,2 Mio) en AVIF (-80 %)
  //   - redimensionnement des WebP servies en pleine résolution native (≈3,7 Mio)
  // ⚠️ Ne PAS mettre `unoptimized: true` ni `output: 'export'` (désactiverait
  //    l'optimisation). Le site est rendu côté serveur sur Vercel.
  // ─────────────────────────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.vegourmet.fr",
        pathname: "/**",
      },
      // Conservation temporaire pour la transition (URLs legacy en cache CDN).
      // À retirer après confirmation que toutes les URLs émises sont static.vegourmet.fr.
      {
        protocol: "https",
        hostname: "veg.s3.fr-par.scw.cloud", // transition-ok
        pathname: "/**",
      },
    ],
  },

  // Les redirections WordPress legacy (query params dédupliqués) sont gérées par
  // les canonical propres + la structure d'URL préservée à l'identique.

  // ─────────────────────────────────────────────────────────────────────────────
  // Redirections SEO — préservation du jus de liens à la bascule WP→Next.js
  //
  //  Les pages /category/<slug> existent désormais nativement (parité WP, 4
  //  catégories réelles : guides-pratiques, conseils-et-astuces,
  //  actualites-et-tendances, inspiration-et-lifestyle). On NE redirige donc
  //  PLUS /category/* vers /blog : chaque catégorie rend sa propre liste
  //  d'articles, à l'identique de WordPress.
  //
  //  En revanche, 5 slugs /category/* correspondent en réalité à des types de
  //  recettes (/recette-type/*) et non à des catégories blog : on les redirige
  //  en 301 permanent. On corrige aussi 3 anciens slugs /category/* dont le
  //  nom a changé (tirets vs mots de liaison).
  //
  //  /boutique n'est PAS géré ici : Next.js redirects() ne peut émettre que des
  //  301/302/307/308, jamais un 410. Le 410 est géré par un Route Handler
  //  → app/boutique/[[...slug]]/route.ts.
  //
  //  Les 6 liens internes 404 dans les corps d'articles sont également couverts
  //  ici (filet de sécurité en plus des corrections MDX directes), afin de
  //  préserver le jus des éventuels backlinks indexés vers les anciennes URLs.
  // ─────────────────────────────────────────────────────────────────────────────

  async redirects() {
    return [
      // ═══════════════════════════════════════════════════════════════════════
      // Redirections WordPress legacy (audit Loki 14 j : 1941 hits 404).
      // Toutes en 301 permanent. trailingSlash:true ⇒ Next normalise les deux
      // variantes (avec/sans slash) et émet une destination à slash final.
      // ═══════════════════════════════════════════════════════════════════════

      // ── Pages utilitaires renommées WP → Next ──────────────────────────────
      {
        source: "/contact",
        destination: "/contactez-nous/",
        permanent: true,
      },
      {
        source: "/nous-contacter",
        destination: "/contactez-nous/",
        permanent: true,
      },
      {
        source: "/mentions-legales",
        destination: "/mentions-legales-politique-de-confidentialite/",
        permanent: true,
      },

      // ── Pagination WordPress /page/:n → page 1 de la section ────────────────
      // La pagination Next.js est portée par la query string `?page=N`
      // (cf. lib/pagination.ts : pageHref ⇒ ...?page=N). Le segment d'URL
      // `/page/:n` est un héritage WordPress qui n'existe plus comme route et
      // n'a aucune valeur SEO (pages profondes paginées, non canoniques). On
      // redirige donc vers la racine (page 1) de chaque section — plus sûr que
      // vers `?page=N` qui ne correspond à aucune URL indexable côté Next.
      {
        source: "/recettes/page/:n(\\d+)",
        destination: "/recettes/",
        permanent: true,
      },
      {
        source: "/blog/page/:n(\\d+)",
        destination: "/blog/",
        permanent: true,
      },
      {
        source: "/recette-thematique/:slug/page/:n(\\d+)",
        destination: "/recette-thematique/:slug/",
        permanent: true,
      },
      {
        source: "/recette-style/:slug/page/:n(\\d+)",
        destination: "/recette-style/:slug/",
        permanent: true,
      },
      {
        source: "/recette-type/:slug/page/:n(\\d+)",
        destination: "/recette-type/:slug/",
        permanent: true,
      },

      // ── Reliquats WP sous /recettes/:slug/* → la recette canonique ─────────
      // Anciennes sous-URL WordPress (flux de commentaires, pagination des
      // commentaires). Un catch-all 410 sous app/recettes/[slug]/ entrerait en
      // collision avec la route réelle (page.tsx + imprimer/). On préfère donc
      // un 301 vers la recette : plus simple, sans conflit de route, et préserve
      // le jus d'éventuels backlinks vers ces URL profondes.
      {
        source: "/recettes/:slug/feed",
        destination: "/recettes/:slug/",
        permanent: true,
      },
      {
        source: "/recettes/:slug/comment-page-:n(\\d+)",
        destination: "/recettes/:slug/",
        permanent: true,
      },

      // ⚠️ PAS de règle /blog/:slug → /:slug : les permaliens WordPress
      // d'origine étaient déjà à la RACINE (vegourmet.fr/<slug>/, cf.
      // archive-wordpress/content/posts.json). Les URL /blog/<slug> n'ont
      // jamais existé publiquement (donnée published_url forgée par le
      // pipeline SEO, corrigée côté BDD). Une redirection ici masquerait
      // l'erreur au lieu de la corriger (décision Victor 2026-06-10).

      // ── Taxonomies dupliquées : /category/X → /recette-type/X ──────────────
      // Ces slugs étaient catégorisés comme "category" dans WP mais sont en
      // réalité des types de recettes. Les redirects matchent avec ou sans slash
      // final (trailingSlash:true génère la variante slash automatiquement).
      {
        source: "/category/plat-vegan",
        destination: "/recette-type/plat-vegan/",
        permanent: true,
      },
      {
        source: "/category/dessert-vegan",
        destination: "/recette-type/dessert-vegan/",
        permanent: true,
      },
      {
        source: "/category/apero-vegan",
        destination: "/recette-type/apero-vegan/",
        permanent: true,
      },
      {
        source: "/category/snack-vegan",
        destination: "/recette-type/snack-vegan/",
        permanent: true,
      },
      {
        source: "/category/petit-dejeuner-vegan",
        destination: "/recette-type/petit-dejeuner-vegan/",
        permanent: true,
      },
      // ── Catégories blog renommées (slug WP → slug Next canonique) ──────────
      {
        source: "/category/guides",
        destination: "/category/guides-pratiques/",
        permanent: true,
      },
      {
        source: "/category/actualites-tendances",
        destination: "/category/actualites-et-tendances/",
        permanent: true,
      },
      {
        source: "/category/inspiration-lifestyle",
        destination: "/category/inspiration-et-lifestyle/",
        permanent: true,
      },
      // ── Filet liens recettes indexés avec ancien slug ──────────────────────
      {
        source: "/recettes/houmous-4-secrets-essentiels-recette-parfaite",
        destination: "/recettes/houmous-4-secrets-pour-une-recette-parfaite/",
        permanent: true,
      },
      // ── Slugs evergreen 2026 : redirection des URL millésimées 2025 ─────────
      {
        source: "/meilleure-whey-vegan-guide-complet-choisir-2025",
        destination: "/meilleure-whey-vegan-guide-complet-choisir/",
        permanent: true,
      },
      {
        source: "/meilleure-proteine-vegan-guide-complet-2025",
        destination: "/meilleure-proteine-vegan-guide-complet/",
        permanent: true,
      },
      {
        source: "/meilleur-fromage-vegan-decouvrez-guide-complet-2025",
        destination: "/meilleur-fromage-vegan-decouvrez-guide-complet/",
        permanent: true,
      },
      {
        source: "/le-meilleur-seitan-guide-comparatif-marques-2025",
        destination: "/le-meilleur-seitan-guide-comparatif-marques/",
        permanent: true,
      },
      {
        source: "/meilleur-tempeh-avis-et-guide-complet-2025",
        destination: "/meilleur-tempeh-avis-et-guide-complet/",
        permanent: true,
      },
      {
        source: "/meilleur-hache-vegetal-avis-test-complet-2025",
        destination: "/meilleur-hache-vegetal-avis-test-complet/",
        permanent: true,
      },
      {
        source: "/meilleur-lait-vegetal-pour-cafe-guide-complet-2025",
        destination: "/meilleur-lait-vegetal-pour-cafe-guide-complet/",
        permanent: true,
      },
      {
        source: "/recettes/cake-au-citron-vegan-meilleure-recette-2025",
        destination: "/recettes/cake-au-citron-vegan-meilleure-recette/",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      // Headers de sécurité : sur toutes les réponses, quel que soit le host.
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      // Dé-indexation permanente des domaines techniques *.vercel.app (P0-1).
      // Conditionnée au host (et non à VERCEL_ENV, vrai aussi sur vercel.app).
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
