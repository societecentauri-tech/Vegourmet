import type { MetadataRoute } from "next";
import { getAllArticles, getAllRecipes } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import { taxoSlugs, type TaxoKind } from "@/lib/taxonomy";

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getAllRecipes();
  const articles = getAllArticles();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/recettes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: `${SITE_URL}/recettes/${recipe.frontmatter.slug}`,
    lastModified: new Date(
      recipe.frontmatter.dateModified ?? recipe.frontmatter.datePublished
    ),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/${article.frontmatter.slug}`,
    lastModified: new Date(
      article.frontmatter.dateModified ?? article.frontmatter.datePublished
    ),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Pages taxonomies : énumération exhaustive de tous les slugs réels (parité
  // vegourmet.fr). Chaque slug rend une page statique 200 canonique
  // (generateStaticParams = taxoSlugs). Couvre les 4 /category/<slug> et les
  // 9 /recette-style/<slug> (dont asie, mexique, italie, africaine, thailande).
  const taxoKinds: TaxoKind[] = [
    "recette-type",
    "recette-style",
    "recette-thematique",
    "category",
  ];
  const taxoPages: MetadataRoute.Sitemap = taxoKinds.flatMap((kind) =>
    taxoSlugs(kind).map((slug) => ({
      url: `${SITE_URL}/${kind}/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticPages, ...recipePages, ...articlePages, ...taxoPages];
}
