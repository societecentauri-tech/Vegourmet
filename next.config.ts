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
  "img-src 'self' data: https://veg.s3.fr-par.scw.cloud",
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
  // POC 100 % statique : aucune image distante téléchargée (cf. images-manifest.json).
  // Les redirections WordPress legacy (query params dédupliqués) sont gérées par
  // les canonical propres + la structure d'URL préservée à l'identique.
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
