import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel, taxoSlugs } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return taxoSlugs("recette-style").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("recette-style", slug);
  return {
    title: `Recettes : cuisine ${label}`,
    description: `Toutes les recettes vegan de cuisine ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/recette-style/${slug}/` },
  };
}

export default async function RecetteStylePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  return <TaxonomyPage kind="recette-style" slug={slug} page={page} />;
}
