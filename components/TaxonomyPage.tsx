import { ListingHeader } from "@/components/ListingHeader";
import {
  RecipeGrid,
  articleToListingItem,
  recipeToListingItem,
} from "@/components/RecipeGrid";
import { Pagination } from "@/components/Pagination";
import { JsonLd } from "@/components/JsonLd";
import {
  type TaxoKind,
  getArticlesForTaxo,
  getRecipesForTaxo,
  getTaxoTitle,
  resolveTaxoLabel,
} from "@/lib/taxonomy";
import { SITE_URL, buildBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/seo";
import { paginate, pageHref } from "@/lib/pagination";

interface TaxonomyPageProps {
  kind: TaxoKind;
  slug: string;
  page?: string;
}

/** Template de listing de taxonomie partagé par les 4 routes taxo. */
export function TaxonomyPage({ kind, slug, page }: TaxonomyPageProps) {
  const label = resolveTaxoLabel(kind, slug);
  const recipes = getRecipesForTaxo(kind, slug);
  const articles = getArticlesForTaxo(kind, slug);

  const items = [
    ...recipes.map(recipeToListingItem),
    ...articles.map(articleToListingItem),
  ];

  const { pageItems, currentPage, totalPages, totalItems } = paginate(items, page);
  const basePath = `/${kind}/${slug}`;
  const url = `${SITE_URL}${basePath}`;

  const description = `Toutes nos recettes et idées vegan de la ${getTaxoTitle(
    kind,
  ).toLowerCase()} « ${label} » : ${totalItems} contenu${
    totalItems > 1 ? "s" : ""
  } à découvrir.`;

  return (
    <div className="vg-archive">
      <JsonLd
        data={buildCollectionJsonLd(
          `${getTaxoTitle(kind)} : ${label}`,
          url,
          pageItems.map((it) => ({ name: it.title, url: `${SITE_URL}${it.href}` })),
        )}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Accueil", url: `${SITE_URL}/` },
          { name: getTaxoTitle(kind), url },
          { name: label, url },
        ])}
      />
      <ListingHeader
        eyebrow={getTaxoTitle(kind)}
        title={label}
        description={description}
      />
      <RecipeGrid
        items={pageItems}
        emptyMessage="Aucun contenu pour cette taxonomie."
      />
      <Pagination
        current={currentPage}
        totalPages={totalPages}
        hrefForPage={(p) => pageHref(basePath, p)}
      />
    </div>
  );
}
