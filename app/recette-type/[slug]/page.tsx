import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return [{ slug: "dessert-vegan" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("recette-type", slug);
  return {
    title: `Recettes : ${label}`,
    description: `Toutes les recettes vegan de type ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/recette-type/${slug}` },
  };
}

export default async function RecetteTypePage({ params }: PageProps) {
  const { slug } = await params;
  return <TaxonomyPage kind="recette-type" slug={slug} />;
}
