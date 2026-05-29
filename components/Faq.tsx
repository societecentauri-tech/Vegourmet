import type { FaqItem } from "@/lib/types";

interface FaqProps {
  items: FaqItem[];
}

/**
 * Bloc FAQ rendu depuis le frontmatter (jamais en MDX inline — gotcha connu :
 * le JSX inline avec caractères spéciaux casse le build). Utilise <details>
 * natif pour l'accessibilité clavier sans JS.
 */
export function Faq({ items }: FaqProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="font-heading text-2xl font-bold">
        Questions fréquentes
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-2xl border border-veg-cream-soft bg-white p-4"
          >
            <summary className="cursor-pointer list-none font-heading font-semibold text-veg-ink-soft marker:content-none">
              {item.q}
            </summary>
            <p className="mt-2 text-veg-ink/80">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
