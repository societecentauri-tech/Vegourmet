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
  limit = 4,
): ArticleFrontmatter[] {
  const others = getAllArticles()
    .map((a) => a.frontmatter)
    .filter((a) => a.slug !== current.slug && a.slug !== "a-propos");

  const sameCategory = others.filter((a) => a.category === current.category);
  const rest = others.filter((a) => a.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}

/**
 * Recettes connexes (« Tu aimeras peut-être aussi… »).
 *
 * Fidélité WP : la fiche recette WP Delicious affiche 3 recettes liées, filtrées par
 * `recipe-course` (= taxonomie `recette-type`). On reproduit cette intention en classant
 * les autres recettes par affinité de cours (recette-type), puis de style (recette-style)
 * et de thématique (recette-thematique), complétée par les étiquettes partagées.
 *
 * On utilise une similarité de Jaccard (intersection / union) plutôt qu'un simple comptage :
 * ~21 fiches portent une liste de cours « fourre-tout » (les 5 cours à la fois, artefact
 * de l'export WP). Un comptage brut les ferait toujours remonter ; le Jaccard pénalise ces
 * listes trop larges et fait ressortir des recettes réellement du même registre.
 * Départage : candidat le plus spécifique (moins de cours) puis le plus récent.
 *
 * NB : WP n'ordonne pas ses 3 liées par score (insertion/aléatoire dans le pool du cours),
 * donc la sélection exacte n'est pas reproductible à l'identique ; on vise une sélection
 * cohérente et déterministe du même registre.
 */
export function getRelatedRecipes(
  current: RecipeFrontmatter,
  limit = 3,
): RecipeFrontmatter[] {
  const jaccard = (a?: string[], b?: string[]): number => {
    const setA = new Set(a ?? []);
    const setB = new Set(b ?? []);
    if (setA.size === 0 || setB.size === 0) return 0;
    let inter = 0;
    for (const value of setA) if (setB.has(value)) inter += 1;
    return inter / (setA.size + setB.size - inter);
  };
  const sharedCount = (a?: string[], b?: string[]): number => {
    const setB = new Set(b ?? []);
    return (a ?? []).filter((value) => setB.has(value)).length;
  };

  const currentTaxos = current.taxonomies;
  const candidates = getAllRecipes()
    .map((r) => r.frontmatter)
    .filter((r) => r.slug !== current.slug)
    .map((r) => {
      const taxos = r.taxonomies;
      const score =
        3 * jaccard(currentTaxos?.["recette-type"], taxos?.["recette-type"]) +
        1.5 * jaccard(currentTaxos?.["recette-style"], taxos?.["recette-style"]) +
        jaccard(
          currentTaxos?.["recette-thematique"],
          taxos?.["recette-thematique"],
        ) +
        0.5 * sharedCount(current.tags, r.tags);
      // Repli pour les fiches sans taxonomie : même catégorie éditoriale.
      const sameCategory = r.category === current.category ? 0.5 : 0;
      const courseCount = (taxos?.["recette-type"] ?? []).length;
      return { fm: r, score: score + sameCategory, courseCount };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // À score égal : le candidat le plus spécifique (moins de cours) d'abord.
      if (a.courseCount !== b.courseCount) return a.courseCount - b.courseCount;
      return (
        new Date(b.fm.datePublished).getTime() -
        new Date(a.fm.datePublished).getTime()
      );
    });

  return candidates.slice(0, limit).map((c) => c.fm);
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
    "a-propos",
  ]);
}

/** Normalise un libellé taxo en slug (ex: « Dessert Vegan » -> « dessert-vegan »). */
export { slugifyTaxo } from "./slug";
