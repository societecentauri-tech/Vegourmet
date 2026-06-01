import type { Metadata } from "next";
import { ListingHeader } from "@/components/ListingHeader";
import { RecipeGrid, articleToListingItem } from "@/components/RecipeGrid";
import { Pagination } from "@/components/Pagination";
import { JsonLd } from "@/components/JsonLd";
import { getAllArticles } from "@/lib/content";
import { SITE_URL, buildBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/seo";
import { paginate, pageHref } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Le blog Vegourmet",
  description:
    "Guides, astuces et inspirations vegan : aquafaba, beurre végétal, idées d'apéro et plus encore.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const allItems = getAllArticles()
    .filter((article) => article.frontmatter.slug !== "a-propos")
    .map((article) => articleToListingItem(article.frontmatter));
  const { pageItems, currentPage, totalPages } = paginate(allItems, page);
  const basePath = "/blog";

  return (
    <div className="vg-archive">
      <JsonLd
        data={buildCollectionJsonLd(
          "Le blog Vegourmet",
          `${SITE_URL}/blog`,
          pageItems.map((it) => ({ name: it.title, url: `${SITE_URL}${it.href}` })),
        )}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Accueil", url: `${SITE_URL}/` },
          { name: "Blog", url: `${SITE_URL}/blog` },
        ])}
      />
      <ListingHeader
        eyebrow="Le blog"
        title="Le blog Vegourmet"
        description="Guides pratiques, astuces et inspirations pour une cuisine végétale réussie."
      />
      <RecipeGrid items={pageItems} />
      <Pagination
        current={currentPage}
        totalPages={totalPages}
        hrefForPage={(p) => pageHref(basePath, p)}
      />
    </div>
  );
}
