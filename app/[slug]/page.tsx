import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/ArticleHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { MdxContent } from "@/components/MdxContent";
import {
  getAllArticles,
  getArticleBySlug,
  getReservedRootSlugs,
} from "@/lib/content";
import {
  SITE_URL,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  const reserved = getReservedRootSlugs();
  return getAllArticles()
    .filter((article) => !reserved.has(article.frontmatter.slug))
    .map((article) => ({ slug: article.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const canonical = `${SITE_URL}/${slug}`;
  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      url: canonical,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const reserved = getReservedRootSlugs();
  if (reserved.has(slug)) notFound();

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const fm = article.frontmatter;
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: fm.title, url: `${SITE_URL}/${fm.slug}` },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={buildArticleJsonLd(article)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />

      <Breadcrumb
        items={breadcrumb.map((b) => ({
          name: b.name,
          href: b.url.replace(SITE_URL, "") || "/",
        }))}
      />

      <div className="mt-6">
        <ArticleHeader article={fm} />
      </div>

      <div className="mt-10">
        <MdxContent source={article.content} />
      </div>

      {fm.faq && fm.faq.length > 0 && (
        <div className="mt-10">
          <Faq items={fm.faq} />
        </div>
      )}
    </article>
  );
}
