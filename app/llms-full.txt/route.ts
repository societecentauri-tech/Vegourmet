import { buildLlmsFullTxt } from "@/lib/llms";

/**
 * Sert `/llms-full.txt` : index Markdown EXHAUSTIF (toutes les recettes + tous
 * les articles, titre + URL + description) pour ingestion IA profonde.
 * Statique (dérivé du contenu MDX au build).
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
