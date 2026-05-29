import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RecipeCard } from "@/components/RecipeCard";
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
  const total = recipes.length + articles.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        items={[
          { name: "Accueil", href: "/" },
          { name: label, href: `/${kind}/${slug}` },
        ]}
      />
      <p className="mt-6 text-sm uppercase tracking-wide text-veg-muted">
        {getTaxoTitle(kind)}
      </p>
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{label}</h1>
      <p className="mt-2 text-veg-ink/75">
        {total} contenu{total > 1 ? "s" : ""} dans cette {getTaxoTitle(kind).toLowerCase()}.
      </p>

      {total === 0 ? (
        <p className="mt-10 rounded-2xl border border-veg-cream-soft bg-white p-6 text-veg-ink/70">
          Aucun contenu pour cette taxonomie dans l'échantillon du POC.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
