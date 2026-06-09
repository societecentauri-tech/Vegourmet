import Link from "next/link";
import type { ArticleFrontmatter } from "@/lib/types";
import { SmartImage } from "./SmartImage";

interface ArticleCardProps {
  article: ArticleFrontmatter;
}

/** Carte article/guide pour l'index blog. */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-veg-cream-soft bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/${article.slug}/`} className="block">
        <SmartImage src={article.heroImage?.src} alt={article.title} ratio="16 / 9" className="rounded-b-none border-0" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-veg-green/10 px-2 py-0.5 text-xs text-veg-green">
          {article.category}
        </span>
        <h3 className="font-heading text-lg font-semibold leading-snug">
          <Link
            href={`/${article.slug}/`}
            className="text-veg-ink-soft hover:text-veg-terracotta-dark"
          >
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-3 flex-1 text-sm text-veg-ink/75">
          {article.description}
        </p>
      </div>
    </article>
  );
}
