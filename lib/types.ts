/** Types partagés du contenu MDX vegourmet (POC statique). */

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  /** Lien affilié (c3po.link) du produit, hérité de la fiche WP Delicious.
   * Si présent, le nom de l'ingrédient devient un lien sponsorisé. */
  affiliateUrl?: string;
  /** Sous-chaîne exacte du `name` qui était liée sur WordPress (ex : « Tofu fumé »
   * pour un name « 200 g Tofu fumé »). Permet de ne lier que le nom, pas la quantité.
   * Fallback : lier le `name` entier si absent. */
  affiliateText?: string;
}

export interface Step {
  text: string;
}

export interface Nutrition {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface HeroImage {
  src: string;
  originalUrl: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface RecipeFrontmatter {
  title: string;
  slug: string;
  description: string;
  datePublished: string;
  author: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  difficulty: string;
  ingredients: Ingredient[];
  steps: Step[];
  nutrition?: Nutrition;
  category: string;
  cuisine: string;
  tags: string[];
  heroImage: HeroImage;
  faq?: FaqItem[];
  /** Date de dernière modification WP (YYYY-MM-DD). Injectée par le script W2.3.
   * Fallback : datePublished (sitemap + JSON-LD). */
  dateModified?: string;
  /** Appartenances aux taxonomies WP (source : pages d'archive vegourmet.fr). */
  taxonomies?: {
    "recette-type": string[];
    "recette-style": string[];
    "recette-thematique": string[];
    category: string[];
  };
}

export interface ArticleFrontmatter {
  title: string;
  slug: string;
  description: string;
  datePublished: string;
  author: string;
  tags: string[];
  category: string;
  /** Slug de la catégorie WP de l'article (source : archives /category/*). */
  categorySlug?: string;
  heroImage: HeroImage;
  faq?: FaqItem[];
  /** Titre custom du bloc FAQ (fidélité WP), ex : « FAQ : Tes questions sur les steaks végétaux ». Fallback : « FAQ ». */
  faqTitle?: string;
  /** Date de dernière modification WP (YYYY-MM-DD). Injectée par le script W2.3.
   * Si absent : les composants font un fallback sur datePublished. */
  dateModified?: string;
}

export interface Recipe {
  frontmatter: RecipeFrontmatter;
  content: string;
}

export interface Article {
  frontmatter: ArticleFrontmatter;
  content: string;
}
