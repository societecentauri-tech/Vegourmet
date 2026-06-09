import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel, taxoSlugs } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return taxoSlugs("recette-type").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("recette-type", slug);
  return {
    title: `Recettes : ${label}`,
    description: `Toutes les recettes vegan de type ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/recette-type/${slug}/` },
  };
}

export default async function RecetteTypePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  return <TaxonomyPage kind="recette-type" slug={slug} page={page} />;
}
