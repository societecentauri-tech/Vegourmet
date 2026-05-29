import type { FaqItem } from "@/lib/types";

interface RecipeFaqProps {
  items: FaqItem[];
}

/**
 * RecipeFaq — bloc FAQ accessible de la page recette (thème Yummy Bites / WP Delicious).
 * Chaque question est un <details>/<summary> natif (clavier + lecteur d'écran).
 */
export function RecipeFaq({ items }: RecipeFaqProps) {
  if (items.length === 0) return null;

  return (
    <section className="vg-section" style={{ borderTop: "none", padding: 0 }} aria-labelledby="vg-faq-heading">
      <h2 className="vg-section__title" id="vg-faq-heading">
        Questions fréquentes
      </h2>
      <div className="vg-faqs">
        {items.map((item, i) => (
          <details className="vg-faq" key={i}>
            <summary>{item.q}</summary>
            <div className="vg-faq__content">{item.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
