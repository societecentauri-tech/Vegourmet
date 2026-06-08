import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintRecipeView } from "@/components/PrintRecipeView";
import { getAllRecipes, getRecipeBySlug } from "@/lib/content";
import { getRecipeRating } from "@/lib/ratings";

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
  return {
    title: `Imprimer : ${recipe.frontmatter.title}`,
    // Page utilitaire d'impression : jamais indexée (évite le duplicate content).
    robots: { index: false, follow: false },
  };
}

export default async function PrintRecipePage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();
  const rating = getRecipeRating(recipe.frontmatter.slug);
  return <PrintRecipeView recipe={recipe.frontmatter} rating={rating} />;
}
