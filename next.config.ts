import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // POC 100 % statique : aucune image distante téléchargée (cf. images-manifest.json).
  // Les redirections WordPress legacy (query params dédupliqués) sont gérées par
  // les canonical propres + la structure d'URL préservée à l'identique.
};

export default nextConfig;
