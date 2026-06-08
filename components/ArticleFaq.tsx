import type { FaqItem } from "@/lib/types";
import "./article.css";

interface ArticleFaqProps {
  items: FaqItem[];
  /** Titre custom du bloc (fidélité WP). Fallback : « FAQ ». */
  title?: string;
}

/**
 * Section FAQ d'article, fidèle au bloc dr-faqs-section-blog du thème.
 * Rendue depuis le frontmatter (jamais en MDX inline — gotcha connu :
 * le JSX inline avec caractères spéciaux casse le build). <details> natif
 * pour l'accessibilité clavier sans JS.
 */
export function ArticleFaq({ items, title }: ArticleFaqProps) {
  if (items.length === 0) return null;

  return (
    <section className="vg-faq-section" aria-labelledby="vg-faq-title">
      <h2 id="vg-faq-title" className="vg-faq-title">
        {title ?? "FAQ"}
      </h2>
      <div className="vg-faq-list">
        {items.map((item, index) => (
          <details key={index} className="vg-faq-item">
            <summary>{item.q}</summary>
            <div className="vg-faq-content">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
