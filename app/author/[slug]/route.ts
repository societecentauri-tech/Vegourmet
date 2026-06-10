// W6 SEO — Pages auteur WordPress supprimées (410 Gone)
//
// Les anciennes pages d'archive auteur WordPress (/author/<slug>) n'existent
// plus dans Next.js (E-E-A-T porté par les frontmatter d'articles, pas par des
// archives auteur paginées). Elles n'ont aucune valeur SEO à préserver. Un 410
// Gone indique explicitement aux robots que la ressource est supprimée
// définitivement (meilleur qu'un 404 pour le budget de recrawl).
//
// ⚠️ Next.js redirects() ne peut émettre que des 301/302/307/308 — jamais un
// 410. Ce Route Handler est donc la seule approche idiomatique.

export function GET(): Response {
  return new Response(null, { status: 410 });
}

export function HEAD(): Response {
  return new Response(null, { status: 410 });
}
