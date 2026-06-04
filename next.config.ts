import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Headers de sécurité + dé-indexation des déploiements non-prod.
//
// La détection « prod » repose sur VERCEL_ENV :
//   - VERCEL_ENV === "production"  → domaine canonique (vegourmet.fr), indexable.
//   - tout le reste (preview / dev / vercel.app) → noindex, nofollow.
//
// But P0-1 : empêcher l'indexation de vegourmet.vercel.app (duplicate content
// avec vegourmet.fr). On NE TOUCHE PAS aux balises canonical → vegourmet.fr,
// déjà émises côté pages : seul un en-tête X-Robots-Tag est ajouté hors-prod.
// ─────────────────────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

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
    const headers = [...SECURITY_HEADERS];

    // Hors production (preview Vercel, vercel.app, dev) : dé-indexation forcée.
    if (!IS_PRODUCTION) {
      headers.push({
        key: "X-Robots-Tag",
        value: "noindex, nofollow",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
