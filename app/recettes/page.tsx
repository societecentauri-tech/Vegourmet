import type { Metadata } from "next";
import { ListingHeader } from "@/components/ListingHeader";
import { RecipeGrid, recipeToListingItem } from "@/components/RecipeGrid";
import { getAllRecipes } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Toutes nos recettes vegan",
  description:
    "Découvrez toutes les recettes vegan de Vegourmet : entrées, plats, desserts et petits-déjeuners, faciles et gourmands.",
  alternates: { canonical: `${SITE_URL}/recettes` },
};

export default function RecipesIndexPage() {
  const recipes = getAllRecipes();
  const items = recipes.map((recipe) => recipeToListingItem(recipe.frontmatter));

  return (
    <div className="vg-archive">
      <ListingHeader
        eyebrow="Recettes"
        title="Toutes nos recettes vegan"
        description={`${recipes.length} recettes faciles et gourmandes, 100 % végétales.`}
      />
      <RecipeGrid items={items} />
    </div>
  );
}
