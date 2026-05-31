/** Types partagés du contenu MDX vegourmet (POC statique). */

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
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
}

export interface Recipe {
  frontmatter: RecipeFrontmatter;
  content: string;
}

export interface Article {
  frontmatter: ArticleFrontmatter;
  content: string;
}
