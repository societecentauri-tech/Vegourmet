/**
 * Composants des blocs comparatifs guides vegourmet (Phase W2).
 * Fidélité pixel-perfect avec le rendu WordPress d'origine (rapport Galaad 2026-06-04).
 *
 * Composants exportés :
 *   - ComparisonTable   : conteneur du comparatif (wrapper + titre)
 *   - ProductCard       : carte produit (winner/défaut, badge, specs, CTA)
 *   - GreenweezCta      : bloc partenaire Greenweez
 *
 * Liens affiliés : target="_blank" + rel="sponsored nofollow noopener noreferrer"
 * (conforme Google, aligné sur ExternalLink.tsx pour c3po.link/fnty.co).
 *
 * Images produits : <img> brut (pas next/image) car hotlink greenweez.com.
 */
import type { ReactNode } from "react";
import "./guide.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Variantes de badge produit (winner = or, spicy = terracotta, versatile = olive) */
export type BadgeVariant = "winner" | "spicy" | "versatile" | "default";

/** Variante du bouton CTA */
export type CtaVariant = "winner" | "default";

/** Spec d'un produit (rating, price ou info neutre) */
export type SpecType = "rating" | "price" | "default";

export interface ProductSpec {
  label: string;
  type?: SpecType;
}

export interface ProductBadgeConfig {
  /** Texte du badge, ex : "🏆 GAGNANT", "Épicé", "Polyvalent" */
  label: string;
  variant?: BadgeVariant;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductBadge
// ─────────────────────────────────────────────────────────────────────────────

interface ProductBadgeProps {
  badge: ProductBadgeConfig;
}

function ProductBadge({ badge }: ProductBadgeProps) {
  const variantClass =
    badge.variant === "spicy"
      ? "guide-product-badge--spicy"
      : badge.variant === "versatile"
        ? "guide-product-badge--versatile"
        : "";

  return (
    <div
      className={["guide-product-badge", variantClass].filter(Boolean).join(" ")}
      aria-label={badge.label}
    >
      {badge.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  /** Carte gagnante : bordure or + fond dégradé crème + badge "🏆 GAGNANT" */
  winner?: boolean;
  /**
   * Badge optionnel (non-gagnant). Si `winner` est vrai, le badge gagnant
   * est généré automatiquement et ce prop est ignoré.
   */
  badge?: ProductBadgeConfig;
  /** Emoji médaille (🥇 🥈 🥉) */
  rank?: string;
  /** URL de l'image produit (hotlink greenweez.com → <img> brut) */
  image?: string;
  /** Texte alternatif de l'image */
  imageAlt?: string;
  /** Nom du produit (texte visible dans le titre) */
  name: string;
  /** URL affiliée c3po.link ou fnty.co */
  href: string;
  /** Note étoiles, ex : "★★★★★" */
  rating?: string;
  /** Prix, ex : "3,29€" */
  price?: string;
  /** Info supplémentaire neutre, ex : "180g" */
  extra?: string;
  /** Texte de l'avis (sans le préfixe "Mon avis :") */
  review?: string;
  /** Usages, ex : "Débutants • Plats mijotés • Grillades • Burgers" */
  tags?: string;
  /** Libellé du bouton CTA, ex : "Je teste le gagnant ! 🏆" */
  ctaLabel: string;
}

/** Attributs rel conformes Google pour liens affiliés */
const AFFILIATE_REL = "sponsored nofollow noopener noreferrer";

export function ProductCard({
  winner = false,
  badge,
  rank,
  image,
  imageAlt = "",
  name,
  href,
  rating,
  price,
  extra,
  review,
  tags,
  ctaLabel,
}: ProductCardProps) {
  const cardClass = [
    "guide-product-card",
    winner ? "guide-product-card--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ctaClass = [
    "guide-cta-button",
    winner ? "guide-cta-button--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Badge : gagnant auto si winner, sinon badge custom si fourni
  const activeBadge: ProductBadgeConfig | null = winner
    ? { label: "🏆 GAGNANT", variant: "winner" }
    : badge ?? null;

  return (
    <div className={cardClass}>
      {activeBadge && <ProductBadge badge={activeBadge} />}

      <div className="guide-card-header">
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="guide-card-image"
            src={image}
            alt={imageAlt}
            width={120}
            height={120}
            loading="lazy"
          />
        )}
        <div className="guide-card-info">
          {rank && <div className="guide-card-rank">{rank}</div>}
          <h3 className="guide-card-name">
            <a href={href} target="_blank" rel={AFFILIATE_REL}>
              {name}
            </a>
          </h3>
          {(rating || price || extra) && (
            <div className="guide-card-specs">
              {rating && (
                <span className="guide-card-spec guide-card-spec--rating">
                  {rating}
                </span>
              )}
              {price && (
                <span className="guide-card-spec guide-card-spec--price">
                  💰 {price}
                </span>
              )}
              {extra && (
                <span className="guide-card-spec">📦 {extra}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {review && (
        <p className="guide-card-review">
          <strong>Mon avis :</strong> {review}
        </p>
      )}

      {tags && (
        <p className="guide-card-tags">✨ Parfait pour : {tags}</p>
      )}

      <a href={href} target="_blank" rel={AFFILIATE_REL} className={ctaClass}>
        {ctaLabel}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ComparisonTable
// ─────────────────────────────────────────────────────────────────────────────

export interface ComparisonTableProps {
  /** Titre visible du comparatif */
  title?: string;
  /** Ancre HTML (id) pour lien de navigation interne */
  anchorId?: string;
  children: ReactNode;
}

export function ComparisonTable({
  title,
  anchorId,
  children,
}: ComparisonTableProps) {
  return (
    <section
      className="guide-comparison-table"
      id={anchorId}
      aria-label={title ?? "Comparatif produits"}
    >
      {title && <h2 className="guide-comparison-title">{title}</h2>}
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GreenweezCta
// ─────────────────────────────────────────────────────────────────────────────

export interface GreenweezCtaProps {
  /** URL du logo (sur S3 vegourmet) */
  logo?: string;
  /** Texte de la marque en majuscules, ex : "GREENWEEZ" */
  brand?: string;
  /** Texte avant l'accent dans le titre */
  titleBefore?: string;
  /** Mot en accentuation olive dans le titre */
  titleAccent?: string;
  /** Texte après l'accent dans le titre */
  titleAfter?: string;
  /** Titre complet (si on ne veut pas découper en 3 parties) */
  title?: string;
  /** Paragraphe de description (texte brut) */
  description?: string;
  /**
   * Avantages séparés par "|", ex : "Livraison 48h|Prix compétitifs|100% bio|+25k produits".
   * Chaîne délimitée (pas un tableau) pour compatibilité avec le pipeline MDX
   * qui ne transmet pas les props de type array/object dans les attributs JSX string.
   */
  specs?: string;
  /** Texte de la pill promo, ex : "🚚 Livraison OFFERTE" */
  promo?: string;
  /** Libellé du bouton CTA */
  ctaLabel: string;
  /** URL affiliée */
  href: string;
}

export function GreenweezCta({
  logo,
  brand = "GREENWEEZ",
  titleBefore,
  titleAccent,
  titleAfter,
  title,
  description,
  specs,
  promo,
  ctaLabel,
  href,
}: GreenweezCtaProps) {
  // Découper la chaîne délimitée en tableau (gotcha MDX : les props array/object
  // ne passent pas via les attributs JSX string dans next-mdx-remote)
  const specItems = specs
    ? specs.split("|").map((s) => s.trim()).filter(Boolean)
    : [];
  // Titre : soit titre complet, soit découpage en 3 parties (avant/accent/après)
  const renderTitle = () => {
    if (title) {
      return <h2 className="guide-greenweez-title">{title}</h2>;
    }
    return (
      <h2 className="guide-greenweez-title">
        {titleBefore}
        {titleAccent && (
          <span className="guide-greenweez-title-accent">{titleAccent}</span>
        )}
        {titleAfter}
      </h2>
    );
  };

  return (
    <aside
      className="guide-greenweez-card"
      aria-label="Partenaire Greenweez"
    >
      <div className="guide-greenweez-badge">✨ PARTENAIRE</div>

      <div className="guide-greenweez-content">
        {/* Colonne gauche : logo + texte + specs */}
        <div className="guide-greenweez-left">
          <div className="guide-greenweez-header">
            {logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                className="guide-greenweez-logo"
                src={logo}
                alt={`Logo ${brand}`}
                width={80}
                height={80}
                loading="lazy"
              />
            )}
            <div>
              <div className="guide-greenweez-brand">{brand}</div>
              {renderTitle()}
            </div>
          </div>

          {description && (
            <p className="guide-greenweez-description">{description}</p>
          )}

          {specItems.length > 0 && (
            <div className="guide-greenweez-specs">
              {specItems.map((spec, i) => (
                <div key={i} className="guide-greenweez-spec">
                  <span className="guide-greenweez-spec-icon">✓</span>
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : promo pill + bouton */}
        <div className="guide-greenweez-right">
          {promo && (
            <div className="guide-greenweez-promo">{promo}</div>
          )}
          <a
            href={href}
            target="_blank"
            rel={AFFILIATE_REL}
            className="guide-greenweez-cta"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </aside>
  );
}
