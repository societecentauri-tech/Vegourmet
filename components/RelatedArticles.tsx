import type { ListingItem } from "./RecipeGrid";
import { ItemCard } from "./RecipeGrid";
import "./article.css";

interface RelatedArticlesProps {
  items: ListingItem[];
}

/** Bloc « Tu aimeras peut-être aussi... » fidèle au thème (articles et recettes). */
export function RelatedArticles({ items }: RelatedArticlesProps) {
  if (items.length === 0) return null;

  return (
    <section className="vg-related" aria-labelledby="vg-related-title">
      <h2 id="vg-related-title" className="vg-related-title">
        Tu aimeras peut-être aussi...
      </h2>
      <div className="vg-related-grid">
        {items.map((item) => (
          <ItemCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}
