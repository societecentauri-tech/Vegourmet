import { getAllRecipes } from "@/lib/content";
import { getCategoryColor } from "@/lib/categoryStyle";
import { HERO_CAROUSEL_SLUGS } from "@/lib/featured-recipes";
import { recipeToListingItem } from "@/components/RecipeGrid";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { FavorisSection } from "@/components/home/FavorisSection";
import type { FavorisItem } from "@/components/home/FavorisCard";
import { AboutChloe } from "@/components/home/AboutChloe";
import { RecipeFinder } from "@/components/home/RecipeFinder";
import {
  BestRecipes,
  type TaggedListingItem,
} from "@/components/home/BestRecipes";
import { QuickRecipesCta } from "@/components/home/QuickRecipesCta";
import { JsonLd } from "@/components/JsonLd";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo";
import type { RecipeFrontmatter } from "@/lib/types";
import "@/components/home.css";

/** Transforme une recette en carte favoris (plain object passé au client). */
function toFavorisItem(recipe: RecipeFrontmatter): FavorisItem {
  const base = recipeToListingItem(recipe);
  return {
    slug: base.slug,
    href: base.href,
    title: base.title,
    category: base.category,
    categoryColor: getCategoryColor(base.category),
    totalTime: base.totalTime,
    difficulty: base.difficulty,
    imageSrc: base.imageSrc,
  };
}

/**
 * Homepage vegourmet.fr — reconstruction fidèle au thème « Yummy Bites »
 * (WP Delicious). Sections, dans l'ordre officiel :
 *   1. Carrousel hero (site-banner banner-slider style-one)
 *   2. Bandeau newsletter (#newsletter_section)
 *   3. Les favoris de nos lecteurs (#featured_area_section)
 *   4. À propos de moi (#about_section)
 *   5. Trouvez la recette parfaite (#search_section)
 *   6. Découvrez nos meilleures recettes (#category_section)
 *   7. CTA recettes rapides (#cta_section)
 * Tout le contenu provient des vraies données MDX (content/recettes).
 */
export default function HomePage() {
  // getAllRecipes() est déjà trié par datePublished desc.
  const recipes = getAllRecipes();
  const recipeFrontmatter = recipes.map((recipe) => recipe.frontmatter);

  // --- Carrousel hero : les recettes les MIEUX classées sur Google (clics GSC),
  // dans l'ordre de classement défini par lib/featured-recipes.ts
  // (source : gsc_by-page 2025-02→2026-06, classé par clics). On exige une vraie
  // photo hero S3. Fallback robuste : si un slug curé manque ou s'il en reste
  // moins de 5 résolus, on complète par les recettes les plus récentes (déjà
  // triées par datePublished desc) — le build ne casse jamais.
  const withHero = recipeFrontmatter.filter((recipe) =>
    Boolean(recipe.heroImage?.src),
  );
  const bySlug = new Map(withHero.map((recipe) => [recipe.slug, recipe]));
  const usedSlugs = new Set<string>();
  const heroRecipes: RecipeFrontmatter[] = [];
  for (const slug of HERO_CAROUSEL_SLUGS) {
    const recipe = bySlug.get(slug);
    if (recipe && !usedSlugs.has(slug)) {
      heroRecipes.push(recipe);
      usedSlugs.add(slug);
    }
  }
  // Complément éventuel jusqu'à 5 slides (recettes récentes non déjà retenues).
  for (const recipe of withHero) {
    if (heroRecipes.length >= 5) break;
    if (!usedSlugs.has(recipe.slug)) {
      heroRecipes.push(recipe);
      usedSlugs.add(recipe.slug);
    }
  }
  const heroSlides: HeroSlide[] = heroRecipes.slice(0, 5).map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    excerpt: recipe.description,
    category: recipe.category,
    categoryColor: getCategoryColor(recipe.category),
    imageSrc: recipe.heroImage?.src,
  }));

  // --- Section favoris : 3 onglets × 4 cartes.
  // Dernières = 4 plus récentes (signal réel : tri datePublished desc).
  const dernieres = recipeFrontmatter.slice(0, 4).map(toFavorisItem);

  // Featured = curation déterministe assumée (pas de vraies vues disponibles) :
  // 4 premières recettes par ordre alphabétique du titre.
  const byTitle = [...recipeFrontmatter].sort((a, b) =>
    a.title.localeCompare(b.title, "fr"),
  );
  const featured = byTitle.slice(0, 4).map(toFavorisItem);

  // Populaires = sous-ensemble déterministe distinct (curation assumée) :
  // 4 recettes suivantes dans l'ordre alphabétique, en évitant les doublons
  // déjà présents dans « Featured ».
  const featuredSlugs = new Set(featured.map((item) => item.slug));
  const populaires = byTitle
    .filter((recipe) => !featuredSlugs.has(recipe.slug))
    .slice(0, 4)
    .map(toFavorisItem);

  // --- Section « meilleures recettes » : échantillon complet (filtré client).
  const bestItems: TaggedListingItem[] = recipeFrontmatter.map((recipe) => ({
    ...recipeToListingItem(recipe),
    tags: recipe.tags,
  }));

  // Photo du CTA : une recette taguée « repas rapides », sinon la première dispo.
  const quickRecipe =
    recipeFrontmatter.find((recipe) =>
      recipe.tags.some((tag) => tag.toLowerCase() === "repas rapides"),
    ) ?? recipeFrontmatter[0];

  return (
    <>
      <JsonLd data={buildWebSiteJsonLd()} />
      <JsonLd data={buildOrganizationJsonLd()} />
      <HeroCarousel slides={heroSlides} />
      <NewsletterBand />
      <FavorisSection
        featured={featured}
        populaires={populaires}
        dernieres={dernieres}
      />
      <AboutChloe />
      <RecipeFinder />
      <BestRecipes items={bestItems} />
      <QuickRecipesCta
        imageSrc={quickRecipe?.heroImage?.src}
        imageAlt={quickRecipe?.title ?? "Recette vegan rapide"}
      />
    </>
  );
}
