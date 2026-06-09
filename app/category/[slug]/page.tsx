import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel, taxoSlugs } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return taxoSlugs("category").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("category", slug);
  return {
    title: `Catégorie : ${label}`,
    description: `Tous les contenus vegan de la catégorie ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/category/${slug}/` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  return <TaxonomyPage kind="category" slug={slug} page={page} />;
}
