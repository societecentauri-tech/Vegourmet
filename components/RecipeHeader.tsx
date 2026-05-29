import type { RecipeFrontmatter } from "@/lib/types";
import { Placeholder } from "./Placeholder";

interface RecipeHeaderProps {
  recipe: RecipeFrontmatter;
}

interface MetaItem {
  label: string;
  value: string;
}

/** En-tête de page recette : titre, méta (temps/portions/difficulté), hero. */
export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const meta: MetaItem[] = [
    { label: "Préparation", value: recipe.prepTime },
    { label: "Cuisson", value: recipe.cookTime },
    { label: "Total", value: recipe.totalTime },
    { label: "Portions", value: recipe.servings },
    { label: "Difficulté", value: recipe.difficulty },
  ].filter((m) => m.value);

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-veg-olive/20 px-3 py-1 text-veg-green">
            {recipe.category}
          </span>
          <span className="rounded-full bg-veg-peach/30 px-3 py-1 text-veg-terracotta-dark">
            {recipe.cuisine}
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {recipe.title}
        </h1>
        <p className="text-lg text-veg-ink/80">{recipe.description}</p>
        <p className="text-sm text-veg-muted">
          Par {recipe.author} ·{" "}
          <time dateTime={recipe.datePublished}>{recipe.datePublished}</time>
        </p>
      </div>

      <Placeholder alt={recipe.title} ratio="3 / 4" className="max-w-md" />

      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-veg-cream-soft bg-white p-4 sm:grid-cols-5">
        {meta.map((item) => (
          <div key={item.label} className="text-center">
            <dt className="text-xs uppercase tracking-wide text-veg-muted">
              {item.label}
            </dt>
            <dd className="font-heading text-sm font-semibold text-veg-ink-soft">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
