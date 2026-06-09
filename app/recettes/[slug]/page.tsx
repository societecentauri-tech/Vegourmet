import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { MdxContent } from "@/components/MdxContent";
import { RecipeArticleHeader } from "@/components/RecipeArticleHeader";
import { RecipeDeliciousCard } from "@/components/RecipeDeliciousCard";
import { RecipeFaq } from "@/components/RecipeFaq";
import { RecipeSidebar } from "@/components/RecipeSidebar";
import { RecipeReviews } from "@/components/RecipeReviews";
import { SimilarRecipes } from "@/components/SimilarRecipes";
import {
  getAllRecipes,
  getRecipeBySlug,
  getRelatedRecipes,
} from "@/lib/content";
import { getRecipeRating } from "@/lib/ratings";
import { getRecipeReviews } from "@/lib/reviews";
import "@/components/recipe.css";
import "@/components/reviews.css";
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
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

  const canonical = `${SITE_URL}/recettes/${slug}/`;
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
  const related = getRelatedRecipes(fm);
  // Note agrégée réelle (snapshot build-time). null = recette non notée.
  const rating = getRecipeRating(fm.slug);
  // Avis individuels réels (snapshot build-time). [] si aucun avis noté.
  const reviews = getRecipeReviews(fm.slug);
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Recettes", url: `${SITE_URL}/recettes/` },
    { name: fm.title, url: `${SITE_URL}/recettes/${fm.slug}/` },
  ];

  return (
    <>
      <div className="vg-recipe-layout">
        <JsonLd data={buildRecipeJsonLd(recipe, rating, reviews)} />
        <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />
        {fm.faq && fm.faq.length > 0 ? (
          <JsonLd data={buildFaqJsonLd(fm.faq)!} />
        ) : null}

        <Breadcrumb
          items={breadcrumb.map((b) => ({
            name: b.name,
            href: b.url.replace(SITE_URL, "") || "/",
          }))}
        />

        <div className="vg-recipe-grid">
          <article className="vg-recipe vg-recipe-main">
            <RecipeArticleHeader recipe={fm} rating={rating} />

            <div className="mt-8">
              <MdxContent source={recipe.content} />
            </div>

            <div className="mt-10">
              <RecipeDeliciousCard recipe={fm} rating={rating} />
              <AffiliateDisclosure />
            </div>

            {fm.faq && fm.faq.length > 0 && (
              <div className="mt-10">
                <RecipeFaq items={fm.faq} />
              </div>
            )}

            <div className="mt-10">
              <RecipeReviews slug={fm.slug} rating={rating} />
            </div>
          </article>

          <RecipeSidebar />
        </div>
      </div>

      <SimilarRecipes recipes={related} />
    </>
  );
}
