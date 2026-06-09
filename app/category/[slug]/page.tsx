import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

// Les seuls slugs valides sont les 4 catégories blog canoniques retournées par
// generateStaticParams(). Tout autre slug (notamment les 5 types de recettes
// /category/plat-vegan etc.) est intercepté AVANT par les redirects 301 dans
// next.config.ts et ne doit jamais atteindre cette page → 404.
export const dynamicParams = false;

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

  // Garder uniquement les 4 slugs blog canoniques. Tout autre slug (y compris
  // les variantes recette-type /category/plat-vegan déjà interceptées en 301)
  // doit retourner 404 — on ne sert pas de page vide ou partiellement remplie.
  if (!taxoSlugs("category").includes(slug)) {
    notFound();
  }

  return <TaxonomyPage kind="category" slug={slug} page={page} />;
}
