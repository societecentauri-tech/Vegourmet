import type { Metadata } from "next";
import { ListingHeader } from "@/components/ListingHeader";
import { RecipeGrid, articleToListingItem } from "@/components/RecipeGrid";
import { getAllArticles } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Le blog Vegourmet",
  description:
    "Guides, astuces et inspirations vegan : aquafaba, beurre végétal, idées d'apéro et plus encore.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  const items = getAllArticles()
    .filter((article) => article.frontmatter.slug !== "a-propos")
    .map((article) => articleToListingItem(article.frontmatter));

  return (
    <div className="vg-archive">
      <ListingHeader
        eyebrow="Le blog"
        title="Le blog Vegourmet"
        description="Guides pratiques, astuces et inspirations pour une cuisine végétale réussie."
      />
      <RecipeGrid items={items} />
    </div>
  );
}
