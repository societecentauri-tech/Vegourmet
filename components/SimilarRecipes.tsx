import type { RecipeFrontmatter } from "@/lib/types";
import { ItemCard, recipeToListingItem } from "./RecipeGrid";
import "./listing.css";

interface SimilarRecipesProps {
  /** Recettes similaires calculées côté serveur (getRelatedRecipes). */
  recipes: RecipeFrontmatter[];
}

/**
 * Bloc « Recettes similaires » — affiché en bas de chaque fiche recette.
 * Aide les pages orphelines/faiblement liées à recevoir du jus interne.
 * Utilise le même composant ItemCard que les grilles de listing.
 */
export function SimilarRecipes({ recipes }: SimilarRecipesProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="vg-similar" aria-labelledby="vg-similar-title">
      <h2 id="vg-similar-title" className="vg-similar-title">
        Recettes similaires
      </h2>
      <div className="vg-similar-grid">
        {recipes.map((recipe) => (
          <ItemCard key={recipe.slug} item={recipeToListingItem(recipe)} />
        ))}
      </div>
    </section>
  );
}
