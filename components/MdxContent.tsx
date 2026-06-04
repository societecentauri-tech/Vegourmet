import { MDXRemote } from "next-mdx-remote/rsc";
import { ExternalLink } from "./ExternalLink";
import "./article.css";

interface MdxContentProps {
  source: string;
}

// Mapping des composants MDX. <a> custom (ExternalLink) pour appliquer les
// attributs rel SEO/sécurité sur les liens affiliés et externes (P1-1 Galahad).
const mdxComponents = {
  a: ExternalLink,
};

/** Rend le corps éditorial MDX avec les styles fidèles du thème (vg-entry-content). */
export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="vg-entry-content">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
