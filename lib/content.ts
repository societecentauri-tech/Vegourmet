import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Article,
  ArticleFrontmatter,
  Recipe,
  RecipeFrontmatter,
} from "./types";

const RECIPES_DIR = path.join(process.cwd(), "content", "recettes");
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readMdxFiles(dir: string): { slug: string; raw: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
      raw: fs.readFileSync(path.join(dir, file), "utf-8"),
    }));
}

export function getAllRecipes(): Recipe[] {
  return readMdxFiles(RECIPES_DIR)
    .map(({ raw }) => {
      const { data, content } = matter(raw);
      return {
        frontmatter: data as RecipeFrontmatter,
        content,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.datePublished).getTime() -
        new Date(a.frontmatter.datePublished).getTime(),
    );
}

export function getRecipeBySlug(slug: string): Recipe | null {
  const recipe = getAllRecipes().find((r) => r.frontmatter.slug === slug);
  return recipe ?? null;
}

export function getAllArticles(): Article[] {
  return readMdxFiles(BLOG_DIR)
    .map(({ raw }) => {
      const { data, content } = matter(raw);
      return {
        frontmatter: data as ArticleFrontmatter,
        content,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.datePublished).getTime() -
        new Date(a.frontmatter.datePublished).getTime(),
    );
}

export function getArticleBySlug(slug: string): Article | null {
  const article = getAllArticles().find((a) => a.frontmatter.slug === slug);
  return article ?? null;
}

/** Estime un temps de lecture en français (~200 mots/min) à partir du corps MDX. */
export function getReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min de lecture`;
}

/**
 * Articles connexes : même catégorie d'abord, complétés par les plus récents.
 * Exclut l'article courant et la page « à-propos ».
 */
export function getRelatedArticles(
  current: ArticleFrontmatter,
  limit = 3,
): ArticleFrontmatter[] {
  const others = getAllArticles()
    .map((a) => a.frontmatter)
    .filter((a) => a.slug !== current.slug && a.slug !== "a-propos");

  const sameCategory = others.filter((a) => a.category === current.category);
  const rest = others.filter((a) => a.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}

/** Slugs racine connus = articles. Sert à éviter toute collision avec les routes statiques. */
export function getReservedRootSlugs(): Set<string> {
  return new Set([
    "recettes",
    "blog",
    "recette-type",
    "recette-style",
    "recette-thematique",
    "category",
  ]);
}

/** Normalise un libellé taxo en slug (ex: « Dessert Vegan » -> « dessert-vegan »). */
export function slugifyTaxo(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
