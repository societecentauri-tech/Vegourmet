import type { ArticleFrontmatter } from "@/lib/types";
import { Placeholder } from "./Placeholder";

interface ArticleHeaderProps {
  article: ArticleFrontmatter;
}

/** En-tête de page article/guide. */
export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <span className="w-fit rounded-full bg-veg-green/10 px-3 py-1 text-xs text-veg-green">
        {article.category}
      </span>
      <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
        {article.title}
      </h1>
      <p className="text-lg text-veg-ink/80">{article.description}</p>
      <p className="text-sm text-veg-muted">
        Par {article.author} ·{" "}
        <time dateTime={article.datePublished}>{article.datePublished}</time>
      </p>
      <Placeholder alt={article.title} ratio="16 / 9" />
    </header>
  );
}
