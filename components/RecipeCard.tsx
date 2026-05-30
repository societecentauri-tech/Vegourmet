import Link from "next/link";
import type { RecipeFrontmatter } from "@/lib/types";
import { SmartImage } from "./SmartImage";

interface RecipeCardProps {
  recipe: RecipeFrontmatter;
}

/** Carte recette pour les grilles (homepage, listings, taxonomies). */
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-veg-cream-soft bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/recettes/${recipe.slug}`} className="block">
        <SmartImage src={recipe.heroImage?.src} alt={recipe.title} ratio="4 / 3" className="rounded-b-none border-0" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-veg-olive/20 px-2 py-0.5 text-veg-green">
            {recipe.category}
          </span>
          <span className="rounded-full bg-veg-peach/30 px-2 py-0.5 text-veg-terracotta-dark">
            {recipe.totalTime}
          </span>
        </div>
        <h3 className="font-heading text-lg font-semibold leading-snug">
          <Link
            href={`/recettes/${recipe.slug}`}
            className="text-veg-ink-soft hover:text-veg-terracotta-dark"
          >
            {recipe.title}
          </Link>
        </h3>
        <p className="line-clamp-3 flex-1 text-sm text-veg-ink/75">
          {recipe.description}
        </p>
      </div>
    </article>
  );
}
