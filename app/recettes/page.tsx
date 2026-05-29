import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RecipeCard } from "@/components/RecipeCard";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        items={[
          { name: "Accueil", href: "/" },
          { name: "Recettes", href: "/recettes" },
        ]}
      />
      <h1 className="mt-6 font-heading text-3xl font-bold sm:text-4xl">
        Toutes nos recettes vegan
      </h1>
      <p className="mt-2 text-veg-ink/75">
        {recipes.length} recettes faciles et gourmandes, 100 % végétales.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.frontmatter.slug} recipe={recipe.frontmatter} />
        ))}
      </div>
    </div>
  );
}
