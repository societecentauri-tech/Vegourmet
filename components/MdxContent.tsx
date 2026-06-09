import { MDXRemote } from "next-mdx-remote/rsc";
import { Callout } from "./Callout";
import { ExternalLink } from "./ExternalLink";
import { MdxImage } from "./MdxImage";
import {
  ComparisonTable,
  GreenweezCta,
  JumpToWinner,
  ProductCard,
  RecipeComboCard,
  RecipeCombos,
} from "./GuideComponents";
import { ProductSlot } from "./ProductSlot";
import { Infographie } from "./Infographie";
import "./article.css";

interface MdxContentProps {
  source: string;
}

// Mapping des composants MDX.
// - <a> custom (ExternalLink) pour appliquer les attributs rel SEO/sécurité.
// - Composants blocs comparatifs guides (Phase W2, rapport Galaad 2026-06-04).
// - ProductSlot : placeholder masqué ; remplacé par un job externe après ~2 j.
const mdxComponents = {
  a: ExternalLink,
  // Images du corps éditorial → next/image (AVIF/WebP responsive, lazy).
  // ⚠️ ExternalLink détecte les images Pinterest épinglables AVANT ce rendu :
  // il extrait src/alt des enfants quand l'ancre pointe vers pinterest.com/pin/
  // create (cf. ExternalLink.extractSingleImage). La détection lit les props du
  // composant `img` mappé, donc PinnableImage reste préservé.
  img: MdxImage,
  Callout,
  ComparisonTable,
  ProductCard,
  GreenweezCta,
  JumpToWinner,
  RecipeCombos,
  RecipeComboCard,
  ProductSlot,
  Infographie,
};

/** Rend le corps éditorial MDX avec les styles fidèles du thème (vg-entry-content). */
export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="vg-entry-content">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
