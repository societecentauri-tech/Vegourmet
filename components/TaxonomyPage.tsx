import { ListingHeader } from "@/components/ListingHeader";
import {
  RecipeGrid,
  articleToListingItem,
  recipeToListingItem,
} from "@/components/RecipeGrid";
import {
  type TaxoKind,
  getArticlesForTaxo,
  getRecipesForTaxo,
  getTaxoTitle,
  resolveTaxoLabel,
} from "@/lib/taxonomy";

interface TaxonomyPageProps {
  kind: TaxoKind;
  slug: string;
}

/** Template de listing de taxonomie partagé par les 4 routes taxo. */
export function TaxonomyPage({ kind, slug }: TaxonomyPageProps) {
  const label = resolveTaxoLabel(kind, slug);
  const recipes = getRecipesForTaxo(kind, slug);
  const articles = getArticlesForTaxo(kind, slug);

  const items = [
    ...recipes.map(recipeToListingItem),
    ...articles.map(articleToListingItem),
  ];

  const description = `Toutes nos recettes et idées vegan de la ${getTaxoTitle(
    kind,
  ).toLowerCase()} « ${label} » : ${items.length} contenu${
    items.length > 1 ? "s" : ""
  } à découvrir.`;

  return (
    <div className="vg-archive">
      <ListingHeader
        eyebrow={getTaxoTitle(kind)}
        title={label}
        description={description}
      />
      <RecipeGrid
        items={items}
        emptyMessage="Aucun contenu pour cette taxonomie dans l'échantillon du POC."
      />
    </div>
  );
}
