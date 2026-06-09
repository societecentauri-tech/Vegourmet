/**
 * Génération du contenu `llms.txt` et `llms-full.txt` (standard llmstxt.org).
 *
 * `llms.txt` = carte CURÉE et concise du site, en Markdown, destinée aux
 * agents IA / crawlers LLM (ChatGPT, Claude, Perplexity, assistants de code…).
 * Format : H1 (nom du site) → blockquote (résumé) → sections `## ` avec des
 * listes de liens annotés `[titre](url) : description`.
 *
 * `llms-full.txt` = variante EXHAUSTIVE : l'intégralité des recettes et des
 * articles listés (titre + URL absolue + description courte), sans embarquer le
 * corps complet des pages (on garde un index dense, pas un méga-dump de plusieurs
 * Mo). Sert à l'ingestion profonde quand un agent veut la liste complète.
 *
 * Les deux fichiers sont dérivés du contenu MDX au build (route handlers
 * `force-static`), donc toujours synchrones avec le site.
 */
import { getAllArticles, getAllRecipes } from "./content";
import { HERO_CAROUSEL_SLUGS } from "./featured-recipes";
import { SITE_NAME, SITE_URL } from "./seo";
import { TAXO_LABELS, taxoSlugs } from "./taxonomy-data";
import type { TaxoKind } from "./taxonomy";

/** Réduit une description à une phrase courte, sur une seule ligne. */
function shortDescription(input: string, maxLen = 160): string {
  const oneLine = input.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  const truncated = oneLine.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLen).trim()}…`;
}

const recipeUrl = (slug: string) => `${SITE_URL}/recettes/${slug}`;
const articleUrl = (slug: string) => `${SITE_URL}/${slug}`;
const taxoUrl = (kind: TaxoKind, slug: string) => `${SITE_URL}/${kind}/${slug}`;

const TAXO_KIND_TITLES: Record<TaxoKind, string> = {
  "recette-type": "Types de recettes",
  "recette-style": "Cuisines du monde",
  "recette-thematique": "Thématiques",
  category: "Catégories du blog",
};

/** En-tête commun aux deux fichiers (H1 + blockquote + contexte). */
function header(): string {
  return [
    `# ${SITE_NAME}`,
    "",
    "> Blog de cuisine 100 % vegan : des recettes végétales accessibles, gourmandes et testées, des guides d'achat comparatifs (laits végétaux, tofu, fromages, protéines…) et des conseils pour cuisiner sans produits d'origine animale. Rédigé par Chloé, créatrice de Vegourmet. Contenu en français.",
    "",
    "Vegourmet aide à cuisiner vegan au quotidien : fiches recettes structurées (ingrédients, étapes, temps, valeurs nutritionnelles) et guides comparatifs indépendants pour bien choisir ses produits végétaux.",
    "",
  ].join("\n");
}

/**
 * `llms.txt` : carte curée.
 * Sections : Recettes (phares + accès), Guides comparatifs, Catégories &
 * taxonomies, À propos / Contact / Légales, Optional (sitemap).
 */
export function buildLlmsTxt(): string {
  const recipes = getAllRecipes();
  const articles = getAllArticles();
  const bySlug = new Map(recipes.map((r) => [r.frontmatter.slug, r]));

  // Recettes phares = top GSC (lib/featured-recipes), complété par les récentes.
  const featured = HERO_CAROUSEL_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (r): r is NonNullable<typeof r> => Boolean(r),
  );

  /**
   * Guides comparatifs et d'achat — slugs reconnus comme « money guides » :
   *  - commencent par « meilleur » ou « meilleure » (ex: meilleur-tofu-…)
   *  - commencent par « le-meilleur- » ou « les-meilleures- »
   *  - commencent par « classement-des-meilleures- »
   *  - commencent par « quel-est-le-meilleur- »
   *  - slug exact de guides thématiques reconnus (protéines, oméga-3, laits végétaux)
   */
  const GUIDE_SLUGS_EXTRA = new Set([
    "lait-vegetal-guide-ultime-alternatives-vegan",
    "les-meilleures-proteines-vegetales-musculation",
    "le-meilleur-seitan-guide-comparatif-marques",
    "classement-des-meilleures-margarines",
    "quel-est-le-meilleur-lait-vegetal-pour-la-sante",
    "omega-3-vegan-7-bienfaits-extraordinaires-votre-sante",
    "proteines-vegetales-7-bienfaits-incroyables-sante",
  ]);

  const isGuide = (slug: string): boolean =>
    /^meilleu/.test(slug) ||
    /^le-meilleur-/.test(slug) ||
    /^les-meilleures-/.test(slug) ||
    /^classement-des-meilleures-/.test(slug) ||
    /^quel-est-le-meilleur-/.test(slug) ||
    GUIDE_SLUGS_EXTRA.has(slug);

  const guides = articles
    .filter((a) => isGuide(a.frontmatter.slug))
    .sort((a, b) => a.frontmatter.slug.localeCompare(b.frontmatter.slug));

  // Articles éditoriaux (conseils, astuces, lifestyle) hors guides comparatifs
  // et hors pages utilitaires (about/contact/légales).
  const utility = new Set([
    "a-propos",
    "contactez-nous",
    "mentions-legales-politique-de-confidentialite",
  ]);
  const editorial = articles.filter(
    (a) => !isGuide(a.frontmatter.slug) && !utility.has(a.frontmatter.slug),
  );

  const lines: string[] = [header()];

  lines.push("## Recettes");
  lines.push("");
  lines.push(
    `- [Toutes les recettes vegan](${SITE_URL}/recettes) : l'index complet des ${recipes.length} recettes vegan du site (entrées, plats, desserts, apéros, petits-déjeuners).`,
  );
  for (const r of featured) {
    lines.push(
      `- [${r.frontmatter.title}](${recipeUrl(r.frontmatter.slug)}) : ${shortDescription(r.frontmatter.description)}`,
    );
  }
  lines.push("");

  lines.push("## Guides comparatifs et d'achat");
  lines.push("");
  lines.push(
    `- [Blog Vegourmet](${SITE_URL}/blog) : tous les guides, comparatifs et conseils pour bien manger vegan.`,
  );
  for (const a of guides) {
    lines.push(
      `- [${a.frontmatter.title}](${articleUrl(a.frontmatter.slug)}) : ${shortDescription(a.frontmatter.description)}`,
    );
  }
  lines.push("");

  lines.push("## Conseils et ingrédients vegan");
  lines.push("");
  for (const a of editorial) {
    lines.push(
      `- [${a.frontmatter.title}](${articleUrl(a.frontmatter.slug)}) : ${shortDescription(a.frontmatter.description)}`,
    );
  }
  lines.push("");

  // Taxonomies : pages d'archive (types, cuisines, thématiques, catégories).
  const taxoKinds: TaxoKind[] = [
    "recette-type",
    "recette-style",
    "recette-thematique",
    "category",
  ];
  lines.push("## Catégories et taxonomies");
  lines.push("");
  for (const kind of taxoKinds) {
    const slugs = taxoSlugs(kind);
    if (slugs.length === 0) continue;
    lines.push(`### ${TAXO_KIND_TITLES[kind]}`);
    lines.push("");
    for (const slug of slugs) {
      const label = TAXO_LABELS[kind]?.[slug] ?? slug;
      lines.push(`- [${label}](${taxoUrl(kind, slug)})`);
    }
    lines.push("");
  }

  lines.push("## À propos, contact et mentions légales");
  lines.push("");
  lines.push(
    `- [À propos de Vegourmet](${SITE_URL}/a-propos) : Chloé, créatrice du blog, sa philosophie et son histoire en cuisine vegan.`,
  );
  lines.push(
    `- [Contact](${articleUrl("contactez-nous")}) : formulaire et coordonnées pour joindre l'équipe Vegourmet.`,
  );
  lines.push(
    `- [Mentions légales et politique de confidentialité](${articleUrl("mentions-legales-politique-de-confidentialite")}) : éditeur, hébergeur et traitement des données personnelles.`,
  );
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  lines.push(
    `- [Plan du site (sitemap XML)](${SITE_URL}/sitemap.xml) : liste exhaustive et datée de toutes les URLs indexables.`,
  );
  lines.push(
    `- [Index complet pour IA (llms-full.txt)](${SITE_URL}/llms-full.txt) : liste complète des recettes et articles avec descriptions.`,
  );
  lines.push("");

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * `llms-full.txt` : index EXHAUSTIF (toutes les recettes + tous les articles),
 * titre + URL + description courte. Pas d'embarquement du corps des pages.
 */
export function buildLlmsFullTxt(): string {
  const recipes = getAllRecipes();
  const articles = getAllArticles();

  const lines: string[] = [header()];

  lines.push(
    "Index exhaustif de tout le contenu publié de Vegourmet (recettes et articles), avec pour chaque page son titre, son URL absolue et une description courte.",
  );
  lines.push("");

  lines.push(`## Recettes (${recipes.length})`);
  lines.push("");
  for (const r of recipes) {
    lines.push(
      `- [${r.frontmatter.title}](${recipeUrl(r.frontmatter.slug)}) : ${shortDescription(r.frontmatter.description)}`,
    );
  }
  lines.push("");

  lines.push(`## Articles et guides (${articles.length})`);
  lines.push("");
  for (const a of articles) {
    lines.push(
      `- [${a.frontmatter.title}](${articleUrl(a.frontmatter.slug)}) : ${shortDescription(a.frontmatter.description)}`,
    );
  }
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Carte curée pour IA (llms.txt)](${SITE_URL}/llms.txt)`);
  lines.push(`- [Plan du site (sitemap XML)](${SITE_URL}/sitemap.xml)`);
  lines.push("");

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
