import type { ArticleFrontmatter } from "@/lib/types";
import { ItemCard, articleToListingItem } from "./RecipeGrid";
import "./article.css";

interface RelatedArticlesProps {
  articles: ArticleFrontmatter[];
}

/** Bloc « Vous aimerez peut-être aussi... » fidèle au thème. */
export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="vg-related" aria-labelledby="vg-related-title">
      <h2 id="vg-related-title" className="vg-related-title">
        Vous aimerez peut-être aussi...
      </h2>
      <div className="vg-related-grid">
        {articles.map((article) => (
          <ItemCard key={article.slug} item={articleToListingItem(article)} />
        ))}
      </div>
    </section>
  );
}
