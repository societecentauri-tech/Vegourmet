// W6 SEO — Flux RSS WordPress supprimé (410 Gone)
//
// L'ancien flux WordPress (/feed, /feed/) n'existe plus dans Next.js et n'a
// aucune valeur SEO à préserver. Un 410 Gone indique explicitement aux robots
// que la ressource est supprimée définitivement (meilleur qu'un 404 pour le
// budget de recrawl).
//
// ⚠️ Next.js redirects() ne peut émettre que des 301/302/307/308 — jamais un
// 410. Ce Route Handler est donc la seule approche idiomatique.
//
// trailingSlash:true ⇒ /feed et /feed/ aboutissent tous deux ici.

export function GET(): Response {
  return new Response(null, { status: 410 });
}

export function HEAD(): Response {
  return new Response(null, { status: 410 });
}
