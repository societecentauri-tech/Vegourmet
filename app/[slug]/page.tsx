import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleFaq } from "@/components/ArticleFaq";
import { ArticleHeader } from "@/components/ArticleHeader";
import { JsonLd } from "@/components/JsonLd";
import { MdxContent } from "@/components/MdxContent";
import { RelatedArticles } from "@/components/RelatedArticles";
import {
  getAllArticles,
  getArticleBySlug,
  getReadingTime,
  getRelatedArticles,
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
  const readingTime = getReadingTime(article.content);
  const related = getRelatedArticles(fm);
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: fm.title, url: `${SITE_URL}/${fm.slug}` },
  ];

  return (
    <>
      <JsonLd data={buildArticleJsonLd(article)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />

      <article className="vg-single">
        <ArticleHeader article={fm} readingTime={readingTime} />

        <div className="vg-content-wrap">
          <MdxContent source={article.content} />

          {fm.faq && fm.faq.length > 0 && <ArticleFaq items={fm.faq} />}
        </div>
      </article>

      <RelatedArticles articles={related} />
    </>
  );
}
