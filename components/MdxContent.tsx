import { MDXRemote } from "next-mdx-remote/rsc";
import "./article.css";

interface MdxContentProps {
  source: string;
}

/** Rend le corps éditorial MDX avec les styles fidèles du thème (vg-entry-content). */
export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="vg-entry-content">
      <MDXRemote source={source} />
    </div>
  );
}
