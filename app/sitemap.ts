import type { MetadataRoute } from "next";
import { getAllArticles, getAllRecipes } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

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
    lastModified: new Date(recipe.frontmatter.datePublished),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/${article.frontmatter.slug}`,
    lastModified: new Date(article.frontmatter.datePublished),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const taxoPages: MetadataRoute.Sitemap = [
    `${SITE_URL}/recette-type/dessert-vegan`,
    `${SITE_URL}/recette-style/europeenne`,
    `${SITE_URL}/recette-thematique/sans-soja`,
    `${SITE_URL}/category/inspiration-et-lifestyle`,
  ].map((url) => ({ url, changeFrequency: "weekly", priority: 0.6 }));

  return [...staticPages, ...recipePages, ...articlePages, ...taxoPages];
}
