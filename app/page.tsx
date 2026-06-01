import { getAllRecipes } from "@/lib/content";
import { recipeToListingItem } from "@/components/RecipeGrid";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { FavorisSection } from "@/components/home/FavorisSection";
import { AboutChloe } from "@/components/home/AboutChloe";
import { RecipeFinder } from "@/components/home/RecipeFinder";
import {
  BestRecipes,
  type TaggedListingItem,
} from "@/components/home/BestRecipes";
import { QuickRecipesCta } from "@/components/home/QuickRecipesCta";
import { JsonLd } from "@/components/JsonLd";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo";
import "@/components/home.css";

/**
 * Homepage vegourmet.fr — reconstruction fidèle au thème « Yummy Bites »
 * (WP Delicious). Sections, dans l'ordre officiel :
 *   1. Bandeau newsletter (#newsletter_section)
 *   2. Les favoris de nos lecteurs (#featured_area_section)
 *   3. À propos de moi (#about_section)
 *   4. Trouvez la recette parfaite (#search_section)
 *   5. Découvrez nos meilleures recettes (#category_section)
 *   6. CTA recettes rapides (#cta_section)
 * Tout le contenu provient des vraies données MDX (content/recettes).
 */
export default function HomePage() {
  const recipes = getAllRecipes();
  const recipeFrontmatter = recipes.map((recipe) => recipe.frontmatter);

  // Items enrichis des tags pour permettre le filtrage côté client.
  const taggedItems: TaggedListingItem[] = recipeFrontmatter.map((recipe) => ({
    ...recipeToListingItem(recipe),
    tags: recipe.tags,
  }));

  // Section « favoris » : sélection des 8 recettes les plus récentes.
  const favorisItems = taggedItems.slice(0, 8);

  // Section « meilleures recettes » : l'ensemble de l'échantillon (filtré client).
  const bestItems = taggedItems;

  // Photo du CTA : une recette taguée « repas rapides », sinon la première dispo.
  const quickRecipe =
    recipeFrontmatter.find((recipe) =>
      recipe.tags.some((tag) => tag.toLowerCase() === "repas rapides"),
    ) ?? recipeFrontmatter[0];

  return (
    <>
      <JsonLd data={buildWebSiteJsonLd()} />
      <JsonLd data={buildOrganizationJsonLd()} />
      <NewsletterBand />
      <FavorisSection items={favorisItems} />
      <AboutChloe />
      <RecipeFinder />
      <BestRecipes items={bestItems} />
      <QuickRecipesCta
        imageSrc={quickRecipe?.heroImage?.src}
        imageAlt={quickRecipe?.title ?? "Recette vegan rapide"}
      />
    </>
  );
}
