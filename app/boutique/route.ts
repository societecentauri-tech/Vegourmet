/**
 * /boutique — HTTP 410 GONE
 *
 * La boutique WP (Yummy Bites shop) n'existe plus sur vegourmet.fr.
 * 410 indique aux moteurs de recherche que le contenu est intentionnellement
 * et définitivement supprimé (vs 404 temporaire).
 *
 * Route handler plutôt que page.tsx car Next.js App Router n'expose pas
 * de mécanisme natif pour émettre 410 depuis un Server Component.
 */
export function GET() {
  return new Response(
    "Cette page n'existe plus.",
    {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}

// HEAD est nécessaire pour que les crawlers (Googlebot, curl -I) reçoivent aussi 410
export function HEAD() {
  return new Response(null, { status: 410 });
}
