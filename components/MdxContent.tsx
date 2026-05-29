import { MDXRemote } from "next-mdx-remote/rsc";

interface MdxContentProps {
  source: string;
}

/** Rend le corps éditorial MDX (nettoyé des blocs Gutenberg parasites au build). */
export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="prose-veg max-w-none text-veg-ink">
      <MDXRemote source={source} />
    </div>
  );
}
