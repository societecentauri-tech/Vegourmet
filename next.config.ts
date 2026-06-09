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
  // Les images sont servies par le bucket S3 public Scaleway `veg`. On autorise
  // ce domaine pour `next/image` afin que l'Image Optimization API de Next/Vercel
  // génère à la volée des variantes AVIF/WebP redimensionnées (`srcset`/`sizes`).
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
  //  /boutique n'est PAS géré ici : Next.js redirects() ne peut émettre que des
  //  301/302/307/308, jamais un 410. Le 410 est géré par un Route Handler
  //  → app/boutique/[[...slug]]/route.ts.
  // ─────────────────────────────────────────────────────────────────────────────

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
