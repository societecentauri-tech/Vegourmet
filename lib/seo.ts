import type { Article, Recipe } from "./types";

export const SITE_URL = "https://vegourmet.fr";
export const SITE_NAME = "Vegourmet";

/** Convertit une durée lisible FR (« 1 hour 10 minutes », « 25 mins ») en ISO 8601. */
export function toIsoDuration(human: string): string {
  if (!human) return "PT0M";
  const lower = human.toLowerCase();
  let hours = 0;
  let minutes = 0;

  const hourMatch = lower.match(/(\d+)\s*(h|hr|hrs|hour|hours|heure|heures)/);
  if (hourMatch) hours = Number.parseInt(hourMatch[1], 10);

  const minMatch = lower.match(/(\d+)\s*(m|min|mins|minute|minutes)/);
  if (minMatch) minutes = Number.parseInt(minMatch[1], 10);

  if (hours === 0 && minutes === 0) {
    const bare = lower.match(/(\d+)/);
    if (bare) minutes = Number.parseInt(bare[1], 10);
  }

  let duration = "PT";
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  return duration === "PT" ? "PT0M" : duration;
}

/** JSON-LD schema.org Recipe (corrige le P0 « Recipe absent » du WordPress source). */
export function buildRecipeJsonLd(recipe: Recipe): Record<string, unknown> {
  const fm = recipe.frontmatter;
  const url = `${SITE_URL}/recettes/${fm.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: fm.title,
    description: fm.description,
    // `image` est REQUIS par Google pour l'éligibilité aux rich results recette.
    ...(fm.heroImage?.src && { image: [fm.heroImage.src] }),
    author: { "@type": "Person", name: fm.author },
    datePublished: fm.datePublished,
    prepTime: toIsoDuration(fm.prepTime),
    cookTime: toIsoDuration(fm.cookTime),
    totalTime: toIsoDuration(fm.totalTime),
    recipeYield: fm.servings,
    recipeCategory: fm.category,
    recipeCuisine: fm.cuisine,
    keywords: fm.tags.join(", "),
    recipeIngredient: fm.ingredients.map((i) =>
      [i.quantity, i.unit, i.name].filter(Boolean).join(" ").trim(),
    ),
    recipeInstructions: fm.steps.map((s, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: s.text,
    })),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  if (fm.nutrition) {
    jsonLd.nutrition = {
      "@type": "NutritionInformation",
      ...(fm.nutrition.calories && { calories: fm.nutrition.calories }),
      ...(fm.nutrition.protein && { proteinContent: fm.nutrition.protein }),
      ...(fm.nutrition.carbs && { carbohydrateContent: fm.nutrition.carbs }),
      ...(fm.nutrition.fat && { fatContent: fm.nutrition.fat }),
    };
  }

  // NB : la FAQ n'est PAS posée sur le Recipe (mainEntity=Questions est invalide).
  // Elle est émise séparément via buildFaqJsonLd() en tant que FAQPage.

  return jsonLd;
}

/** JSON-LD FAQPage autonome (valide). À émettre à côté du Recipe/Article si FAQ. */
export function buildFaqJsonLd(
  faq: { q: string; a: string }[],
): Record<string, unknown> | null {
  if (!faq || faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** JSON-LD schema.org Article pour les guides/articles racine. */
export function buildArticleJsonLd(article: Article): Record<string, unknown> {
  const fm = article.frontmatter;
  const url = `${SITE_URL}/${fm.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: fm.title,
    description: fm.description,
    ...(fm.heroImage?.src && { image: [fm.heroImage.src] }),
    author: { "@type": "Person", name: fm.author },
    datePublished: fm.datePublished,
    keywords: fm.tags.join(", "),
    articleSection: fm.category,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/logo-vegourmet.png`,
      },
    },
  };
}

/** JSON-LD BreadcrumbList générique. */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** JSON-LD WebSite (+ SearchAction) — pour la home. */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/recettes?s={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD Organization — pour la home. */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-vegourmet.png`,
    sameAs: [
      "https://www.facebook.com/profile.php?id=61568255593913",
      "https://www.instagram.com/vegourmetoff/",
      "https://x.com/VegourmetOff",
      "https://fr.pinterest.com/vegourmetoff/",
    ],
  };
}

/** JSON-LD CollectionPage + ItemList — pour /recettes, /blog et les taxonomies. */
export function buildCollectionJsonLd(
  name: string,
  url: string,
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url,
    inLanguage: "fr-FR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}
