import { getAllRecipes } from "@/lib/content";
import { getCategoryColor } from "@/lib/categoryStyle";
import { HERO_CAROUSEL_SLUGS } from "@/lib/featured-recipes";
import { recipeToListingItem } from "@/components/RecipeGrid";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { getRecipeRating } from "@/lib/ratings";
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
 *   2. Bandeau newsletter (#newsletter)
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

  // --- Carrousel hero HYBRIDE : 6 slides = 3 POPULAIRES + 3 RÉCENTES,
  // ENTRELACÉES en commençant par une populaire :
  //   [pop1, recent1, pop2, recent2, pop3, recent3]  (galette en slide 1).
  //
  // • 3 POPULAIRES = HERO_CAROUSEL_SLUGS (top-3 clics GSC 60 j, lib/featured-recipes.ts),
  //   statique/documenté, rafraîchissable manuellement.
  // • 3 RÉCENTES = les 3 recettes les plus récentes par datePublished desc
  //   (getAllRecipes() est déjà trié) ayant une heroImage — calcul DYNAMIQUE :
  //   toute nouvelle publication remonte automatiquement.
  // • DÉDOUBLONNAGE : on exige une vraie photo hero S3 ; une « récente » déjà
  //   présente dans les populaires est sautée au profit de la suivante par date ;
  //   un slug populaire manquant est ignoré proprement. Fallback robuste : si on
  //   n'atteint pas 6 slides, on complète par d'autres recettes récentes avec
  //   image — le build ne casse jamais.
  const withHero = recipeFrontmatter.filter((recipe) =>
    Boolean(recipe.heroImage?.src),
  );
  const bySlug = new Map(withHero.map((recipe) => [recipe.slug, recipe]));
  const usedSlugs = new Set<string>();

  // 1) Résoudre les 3 populaires (dans l'ordre de la liste curée).
  const popularRecipes: RecipeFrontmatter[] = [];
  for (const slug of HERO_CAROUSEL_SLUGS) {
    if (popularRecipes.length >= 3) break;
    const recipe = bySlug.get(slug);
    if (recipe && !usedSlugs.has(slug)) {
      popularRecipes.push(recipe);
      usedSlugs.add(slug);
    }
  }

  // 2) Résoudre les 3 plus récentes (datePublished desc) NON déjà retenues
  //    comme populaires (dédoublonnage).
  const recentRecipes: RecipeFrontmatter[] = [];
  for (const recipe of withHero) {
    if (recentRecipes.length >= 3) break;
    if (!usedSlugs.has(recipe.slug)) {
      recentRecipes.push(recipe);
      usedSlugs.add(recipe.slug);
    }
  }

  // 3) Entrelacer [pop1, recent1, pop2, recent2, pop3, recent3].
  const heroRecipes: RecipeFrontmatter[] = [];
  for (let i = 0; i < 3; i += 1) {
    if (popularRecipes[i]) heroRecipes.push(popularRecipes[i]);
    if (recentRecipes[i]) heroRecipes.push(recentRecipes[i]);
  }
  // 4) Fallback : compléter jusqu'à 6 slides avec d'autres recettes à image.
  for (const recipe of withHero) {
    if (heroRecipes.length >= 6) break;
    if (!usedSlugs.has(recipe.slug)) {
      heroRecipes.push(recipe);
      usedSlugs.add(recipe.slug);
    }
  }
  const heroSlides: HeroSlide[] = heroRecipes.slice(0, 6).map((recipe) => {
    const rating = getRecipeRating(recipe.slug);
    return {
      slug: recipe.slug,
      title: recipe.title,
      excerpt: recipe.description,
      category: recipe.category,
      categoryColor: getCategoryColor(recipe.category),
      imageSrc: recipe.heroImage?.src,
      totalTime: recipe.totalTime,
      difficulty: recipe.difficulty,
      rating: rating ? { value: rating.ratingValue, count: rating.ratingCount } : null,
      thematiques: recipe.taxonomies?.["recette-thematique"] ?? [],
    };
  });

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
