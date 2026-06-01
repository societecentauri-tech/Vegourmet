import type { Metadata } from "next";
import { ListingHeader } from "@/components/ListingHeader";
import { RecipeGrid, recipeToListingItem } from "@/components/RecipeGrid";
import { Pagination } from "@/components/Pagination";
import { JsonLd } from "@/components/JsonLd";
import { getAllRecipes } from "@/lib/content";
import { SITE_URL, buildBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/seo";
import { paginate, pageHref } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Toutes nos recettes vegan",
  description:
    "Découvrez toutes les recettes vegan de Vegourmet : entrées, plats, desserts et petits-déjeuners, faciles et gourmands.",
  alternates: { canonical: `${SITE_URL}/recettes` },
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function RecipesIndexPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const recipes = getAllRecipes();
  const allItems = recipes.map((recipe) => recipeToListingItem(recipe.frontmatter));
  const { pageItems, currentPage, totalPages, totalItems } = paginate(allItems, page);
  const basePath = "/recettes";

  return (
    <div className="vg-archive">
      <JsonLd
        data={buildCollectionJsonLd(
          "Toutes nos recettes vegan",
          `${SITE_URL}/recettes`,
          pageItems.map((it) => ({ name: it.title, url: `${SITE_URL}${it.href}` })),
        )}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Accueil", url: `${SITE_URL}/` },
          { name: "Recettes", url: `${SITE_URL}/recettes` },
        ])}
      />
      <ListingHeader
        eyebrow="Recettes"
        title="Toutes nos recettes vegan"
        description={`${totalItems} recettes faciles et gourmandes, 100 % végétales.`}
      />
      <RecipeGrid items={pageItems} />
      <Pagination
        current={currentPage}
        totalPages={totalPages}
        hrefForPage={(p) => pageHref(basePath, p)}
      />
    </div>
  );
}
