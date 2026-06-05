import type { Ingredient } from "@/lib/types";
import { IngredientName } from "./IngredientName";

interface IngredientListProps {
  ingredients: Ingredient[];
}

/** Liste d'ingrédients structurée d'une recette.
 * Les ingrédients porteurs d'un `affiliateUrl` rendent leur nom en lien sponsorisé
 * (cf. IngredientName), fidèle à la fiche WordPress d'origine. */
export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <section aria-labelledby="ingredients-title">
      <h2 id="ingredients-title" className="font-heading text-2xl font-bold">
        Ingrédients
      </h2>
      <ul className="mt-4 divide-y divide-veg-cream-soft rounded-2xl border border-veg-cream-soft bg-white">
        {ingredients.map((ingredient, index) => (
          <li
            key={`${ingredient.name}-${index}`}
            className="flex items-baseline gap-3 px-4 py-2.5"
          >
            <span className="min-w-[5rem] font-heading text-sm font-semibold text-veg-terracotta-dark">
              {[ingredient.quantity, ingredient.unit].filter(Boolean).join(" ")}
            </span>
            <span className="text-veg-ink">
              <IngredientName ingredient={ingredient} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
