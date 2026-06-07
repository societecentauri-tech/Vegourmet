import { buildLlmsTxt } from "@/lib/llms";

/**
 * Sert `/llms.txt` (standard llmstxt.org) : carte Markdown curée du site pour
 * les agents IA / crawlers LLM. Statique (dérivé du contenu MDX au build).
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
