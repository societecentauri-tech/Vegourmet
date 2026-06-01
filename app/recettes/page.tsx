import type { Metadata } from "next";
import Link from "next/link";
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
  searchParams: Promise<{ page?: string; s?: string }>;
}

/** Normalise pour une comparaison insensible aux accents et à la casse. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default async function RecipesIndexPage({ searchParams }: PageProps) {
  const { page, s } = await searchParams;
  const query = (s ?? "").trim();
  const recipes = getAllRecipes().map((r) => r.frontmatter);

  const filtered = query
    ? recipes.filter((r) => {
        const haystack = norm(
          [r.title, r.description, r.category, r.cuisine, ...(r.tags ?? [])].join(" "),
        );
        return norm(query)
          .split(/\s+/)
          .every((word) => haystack.includes(word));
      })
    : recipes;

  const allItems = filtered.map((fm) => recipeToListingItem(fm));
  const { pageItems, currentPage, totalPages, totalItems } = paginate(allItems, page);
  const basePath = query ? `/recettes?s=${encodeURIComponent(query)}` : "/recettes";

  const title = query ? `Résultats pour « ${query} »` : "Toutes nos recettes vegan";
  const description = query
    ? `${totalItems} recette${totalItems > 1 ? "s" : ""} trouvée${totalItems > 1 ? "s" : ""} pour votre recherche.`
    : `${totalItems} recettes faciles et gourmandes, 100 % végétales.`;

  return (
    <div className="vg-archive">
      <JsonLd
        data={buildCollectionJsonLd(
          title,
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
        eyebrow={query ? "Recherche" : "Recettes"}
        title={title}
        description={description}
      />
      {query && totalItems === 0 ? (
        <p className="vg-empty">
          Aucune recette ne correspond à « {query} ».{" "}
          <Link href="/recettes">Voir toutes les recettes</Link>.
        </p>
      ) : (
        <>
          <RecipeGrid items={pageItems} />
          <Pagination
            current={currentPage}
            totalPages={totalPages}
            hrefForPage={(p) => pageHref(basePath, p)}
          />
        </>
      )}
    </div>
  );
}
