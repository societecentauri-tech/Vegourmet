import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAllArticles } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Le blog Vegourmet",
  description:
    "Guides, astuces et inspirations vegan : aquafaba, beurre végétal, idées d'apéro et plus encore.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  const articles = getAllArticles().filter(
    (article) => article.frontmatter.slug !== "a-propos",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        items={[
          { name: "Accueil", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />
      <h1 className="mt-6 font-heading text-3xl font-bold sm:text-4xl">
        Le blog Vegourmet
      </h1>
      <p className="mt-2 text-veg-ink/75">
        Guides pratiques, astuces et inspirations pour une cuisine végétale réussie.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.frontmatter.slug} article={article.frontmatter} />
        ))}
      </div>
    </div>
  );
}
