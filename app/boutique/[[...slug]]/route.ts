// W3 SEO — Boutique WooCommerce supprimée (410 Gone)
//
// L'ancienne boutique WooCommerce (/boutique, /boutique/produit/*, etc.)
// n'existe plus dans Next.js et n'a aucune valeur SEO à préserver.
// Un 410 Gone indique explicitement aux robots que la ressource est
// supprimée définitivement (meilleur qu'un 404 pour le recrawl budget).
//
// ⚠️ Next.js redirects() ne peut émettre que des 301/302/307/308 —
// jamais un 410. Ce Route Handler est donc la seule approche idiomatique.
//
// Couvre : /boutique, /boutique/*, /boutique/produit/X, etc.

export function GET(): Response {
  return new Response(null, { status: 410 });
}

export function POST(): Response {
  return new Response(null, { status: 410 });
}

export function HEAD(): Response {
  return new Response(null, { status: 410 });
}
