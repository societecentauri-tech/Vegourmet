import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return [{ slug: "inspiration-et-lifestyle" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("category", slug);
  return {
    title: `Catégorie : ${label}`,
    description: `Tous les contenus vegan de la catégorie ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <TaxonomyPage kind="category" slug={slug} />;
}
