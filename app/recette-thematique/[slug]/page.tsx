import type { Metadata } from "next";
import { TaxonomyPage } from "@/components/TaxonomyPage";
import { SITE_URL } from "@/lib/seo";
import { resolveTaxoLabel } from "@/lib/taxonomy";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return [{ slug: "sans-soja" }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = resolveTaxoLabel("recette-thematique", slug);
  return {
    title: `Recettes : ${label}`,
    description: `Toutes les recettes vegan sur la thématique ${label} sur Vegourmet.`,
    alternates: { canonical: `${SITE_URL}/recette-thematique/${slug}` },
  };
}

export default async function RecetteThematiquePage({ params }: PageProps) {
  const { slug } = await params;
  return <TaxonomyPage kind="recette-thematique" slug={slug} />;
}
