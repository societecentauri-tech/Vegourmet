import type { MetadataRoute } from "next";
import { getAllArticles, getAllRecipes } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import { taxoSlugs, type TaxoKind } from "@/lib/taxonomy";

/**
 * Sitemap unique (vegourmet ~220 URLs, très en dessous des limites 50 000 URLs /
 * 50 Mo : aucun intérêt à scinder en index multi-sitemaps façon Rank Math, qui
 * forcerait des shards `?id=N` et multiplierait les fetchs GSC sans bénéfice de
 * monitoring à ce volume).
 *
 * Indexation des images (enjeu fort sur un site de recettes) : chaque entrée
 * recette/article expose son `heroImage` (CDN static.vegourmet.fr) via le champ `images` de Next, qui
 * émet un `<image:image><image:loc>…</image:loc></image:image>` dans le XML
 * (namespace image ajouté automatiquement par Next). Google Images peut ainsi
 * indexer les visuels.
 *
 * Couverture : home + listings + 134 recettes + articles + pages taxonomies
 * (dont les 4 /category/<slug>) + pages institutionnelles (à-propos, contact,
 * mentions légales — servies via la route [slug] ou une route dédiée).
 *
 * Exclusions (jamais listées ici) :
 *  - /boutique et /boutique/* → 410 Gone (route handler dédié)
 *  - /comment-creer-un-blog-de-cuisine-qui-cartonne → 410 Gone (article supprimé)
 *  - doublons WP en query params → disallow robots.ts
 * Ces URLs n'existent pas dans le contenu MDX, donc ne peuvent pas remonter.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getAllRecipes();
  const articles = getAllArticles();

  // ⚠️ trailingSlash: true dans next.config.ts aligne les URL servis sur le
  // format WP (avec slash final). Next n'injecte PAS automatiquement le slash
  // dans les <loc> du sitemap : on le pose ici explicitement.
  // Les loc d'images (heroImage.src) pointent vers le CDN static.vegourmet.fr —
  // ne jamais leur ajouter de slash.
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/recettes/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog/`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const parseDate = (raw: string | undefined): Date | undefined => {
    if (!raw) return undefined;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: `${SITE_URL}/recettes/${recipe.frontmatter.slug}/`,
    lastModified: parseDate(
      recipe.frontmatter.dateModified ?? recipe.frontmatter.datePublished
    ),
    changeFrequency: "monthly",
    priority: 0.8,
    images: [recipe.frontmatter.heroImage.src],
  }));

  const articlePages: MetadataRoute.Sitemap = articles
    .filter((article) => !article.frontmatter.noindex)
    .map((article) => ({
    url: `${SITE_URL}/${article.frontmatter.slug}/`,
    lastModified: parseDate(
      article.frontmatter.dateModified ?? article.frontmatter.datePublished
    ),
    changeFrequency: "monthly",
    priority: 0.7,
    // heroImage est optionnel (pages utilitaires comme /contactez-nous n'ont pas de hero).
    ...(article.frontmatter.heroImage?.src
      ? { images: [article.frontmatter.heroImage.src] }
      : {}),
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
      url: `${SITE_URL}/${kind}/${slug}/`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticPages, ...recipePages, ...articlePages, ...taxoPages];
}
