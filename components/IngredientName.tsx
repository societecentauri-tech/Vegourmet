import { Fragment } from "react";
import type { Ingredient } from "@/lib/types";

interface IngredientNameProps {
  ingredient: Pick<Ingredient, "name" | "affiliateUrl" | "affiliateText">;
}

/**
 * Rend le nom d'un ingrédient, en transformant en lien affilié sponsorisé la
 * partie liée sur WordPress (`affiliateText`) quand `affiliateUrl` est présent.
 *
 * Fidèle à WP : sur la fiche Delicious, seuls les ingrédients « produit » étaient
 * des liens cliquables (vers c3po.link / Greenweez), pas la quantité.
 *   - `affiliateText` présent et contenu dans `name` -> on ne lie que cette partie.
 *   - `affiliateText` absent -> on lie le `name` entier (fallback robuste).
 *   - pas d'`affiliateUrl` -> texte simple, aucun lien.
 *
 * Attributs SEO/sécurité : rel="sponsored nofollow noopener" + target="_blank".
 */
export function IngredientName({ ingredient }: IngredientNameProps) {
  const { name, affiliateUrl, affiliateText } = ingredient;

  if (!affiliateUrl) {
    return <>{name}</>;
  }

  const link = (text: string) => (
    <a
      href={affiliateUrl}
      rel="sponsored nofollow noopener"
      target="_blank"
      className="vg-ing-link"
    >
      {text}
    </a>
  );

  // Ne lier que la sous-chaîne effectivement liée sur WP, si on la retrouve.
  if (affiliateText && name.includes(affiliateText)) {
    const idx = name.indexOf(affiliateText);
    const before = name.slice(0, idx);
    const after = name.slice(idx + affiliateText.length);
    return (
      <Fragment>
        {before}
        {link(affiliateText)}
        {after}
      </Fragment>
    );
  }

  // Fallback : lier le nom entier.
  return link(name);
}
