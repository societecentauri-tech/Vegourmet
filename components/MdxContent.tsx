import { MDXRemote } from "next-mdx-remote/rsc";
import { ExternalLink } from "./ExternalLink";
import {
  ComparisonTable,
  GreenweezCta,
  ProductCard,
} from "./GuideComponents";
import "./article.css";

interface MdxContentProps {
  source: string;
}

// Mapping des composants MDX.
// - <a> custom (ExternalLink) pour appliquer les attributs rel SEO/sécurité.
// - Composants blocs comparatifs guides (Phase W2, rapport Galaad 2026-06-04).
const mdxComponents = {
  a: ExternalLink,
  ComparisonTable,
  ProductCard,
  GreenweezCta,
};

/** Rend le corps éditorial MDX avec les styles fidèles du thème (vg-entry-content). */
export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="vg-entry-content">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
