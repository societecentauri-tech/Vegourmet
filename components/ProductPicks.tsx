import { getProductPicks } from "@/lib/product-picks";
import "./product-picks.css";

/**
 * ProductPicks — bloc « Produits sélectionnés par Chloé » (fidélité WP).
 * Titre custom + cartes produit (image / nom / avis) en liens affiliés + CTA
 * « Commander en 1 clic ». Inséré dans la fiche recette, avant les instructions.
 */
export function ProductPicks({ slug }: { slug: string }) {
  const picks = getProductPicks(slug);
  if (!picks) return null;

  return (
    <aside className="vg-picks" aria-label="Produits sélectionnés par Chloé">
      <div className="vg-picks__head">
        <h3 className="vg-picks__title">{picks.title}</h3>
        <div className="vg-picks__by">✓ Sélectionnés par Chloé</div>
      </div>

      <div className="vg-picks__list">
        {picks.products.map((p, i) => (
          <a
            key={`${p.url}-${i}`}
            href={p.url}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="vg-picks__card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.name}
              width={55}
              height={55}
              loading="lazy"
              className="vg-picks__img"
            />
            <span className="vg-picks__info">
              <span className="vg-picks__name">{p.name.replace(" - ", " ")}</span>
              <span className="vg-picks__desc">{p.description}</span>
            </span>
            <span className="vg-picks__arrow" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>

      {picks.ctaUrl && (
        <a
          href={picks.ctaUrl}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="vg-picks__cta"
        >
          🛒 Commander en 1 clic (Livraison Offerte)
        </a>
      )}
    </aside>
  );
}
