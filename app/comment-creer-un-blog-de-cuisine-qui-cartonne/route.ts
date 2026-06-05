// SEO — Article « méta-blogging » supprimé (410 Gone)
//
// L'article /comment-creer-un-blog-de-cuisine-qui-cartonne était hors-sujet
// (méta-blogging sur un site de recettes vegan) et servait d'appât à backlinks
// sans valeur éditoriale. Il a été supprimé (content/blog/*.mdx retiré).
//
// On émet un 410 Gone (et non un 404) pour signaler explicitement aux robots
// que la ressource est supprimée définitivement : le signal des liens entrants
// est ainsi coupé proprement (intention SEO = ne plus relayer ce contenu).
//
// ⚠️ Next.js redirects() ne peut émettre que des 301/302/307/308 — jamais un
// 410. Ce Route Handler statique est donc la seule approche idiomatique. Il a
// priorité sur la route dynamique app/[slug]/page.tsx pour ce slug précis.

export function GET(): Response {
  return new Response(null, { status: 410 });
}

export function POST(): Response {
  return new Response(null, { status: 410 });
}

export function HEAD(): Response {
  return new Response(null, { status: 410 });
}
