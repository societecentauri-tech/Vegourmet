import "./listing.css";

interface ListingHeaderProps {
  /** Sur-titre (ex. « Type de recette »). */
  eyebrow?: string;
  /** Titre principal de la catégorie/archive. */
  title: string;
  /** Description optionnelle de la catégorie. */
  description?: string;
}

/** En-tête de page de listing / taxonomie (titre + description). */
export function ListingHeader({ eyebrow, title, description }: ListingHeaderProps) {
  return (
    <header className="vg-archive-header">
      {eyebrow && <p className="vg-archive-eyebrow">{eyebrow}</p>}
      <h1 className="vg-archive-title">{title}</h1>
      {description && <p className="vg-archive-desc">{description}</p>}
    </header>
  );
}
