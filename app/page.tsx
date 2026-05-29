import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllArticles, getAllRecipes } from "@/lib/content";

export default function HomePage() {
  const recipes = getAllRecipes().slice(0, 6);
  const articles = getAllArticles()
    .filter((article) => article.frontmatter.slug !== "a-propos")
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-br from-veg-peach/30 via-veg-cream to-veg-olive/20 px-6 py-14 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight text-veg-terracotta-dark sm:text-5xl">
          Recettes Vegan Faciles &amp; Gourmandes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-veg-ink/80">
          Vegourmet, le blog culinaire qui prouve que la cuisine végétale peut être
          simple, accessible et, surtout, sans renoncer au plaisir.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/recettes"
            className="rounded-full bg-veg-green px-6 py-2.5 font-medium text-white transition hover:bg-veg-green-bright"
          >
            Voir les recettes
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-veg-terracotta-dark px-6 py-2.5 font-medium text-veg-terracotta-dark transition hover:bg-veg-terracotta-dark hover:text-white"
          >
            Lire le blog
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold">Dernières recettes</h2>
          <Link href="/recettes" className="text-sm font-medium hover:underline">
            Toutes les recettes →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.frontmatter.slug} recipe={recipe.frontmatter} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold">Sur le blog</h2>
          <Link href="/blog" className="text-sm font-medium hover:underline">
            Tous les articles →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.frontmatter.slug} article={article.frontmatter} />
          ))}
        </div>
      </section>
    </div>
  );
}
