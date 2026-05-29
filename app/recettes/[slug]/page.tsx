import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import { IngredientList } from "@/components/IngredientList";
import { JsonLd } from "@/components/JsonLd";
import { MdxContent } from "@/components/MdxContent";
import { RecipeHeader } from "@/components/RecipeHeader";
import { StepList } from "@/components/StepList";
import { getAllRecipes, getRecipeBySlug } from "@/lib/content";
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildRecipeJsonLd,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllRecipes().map((recipe) => ({ slug: recipe.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return {};

  const canonical = `${SITE_URL}/recettes/${slug}`;
  return {
    title: recipe.frontmatter.title,
    description: recipe.frontmatter.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: recipe.frontmatter.title,
      description: recipe.frontmatter.description,
      url: canonical,
    },
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const fm = recipe.frontmatter;
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Recettes", url: `${SITE_URL}/recettes` },
    { name: fm.title, url: `${SITE_URL}/recettes/${fm.slug}` },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={buildRecipeJsonLd(recipe)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />

      <Breadcrumb
        items={breadcrumb.map((b) => ({
          name: b.name,
          href: b.url.replace(SITE_URL, "") || "/",
        }))}
      />

      <div className="mt-6">
        <RecipeHeader recipe={fm} />
      </div>

      <div className="mt-10">
        <MdxContent source={recipe.content} />
      </div>

      <div className="mt-10">
        <IngredientList ingredients={fm.ingredients} />
      </div>

      <div className="mt-10">
        <StepList steps={fm.steps} />
      </div>

      {fm.faq && fm.faq.length > 0 && (
        <div className="mt-10">
          <Faq items={fm.faq} />
        </div>
      )}
    </article>
  );
}
