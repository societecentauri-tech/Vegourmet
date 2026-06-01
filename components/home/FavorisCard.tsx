"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { formatDureeFr } from "@/lib/duration";

/** Carte favoris — données déjà mappées côté serveur (plain object). */
export interface FavorisItem {
  slug: string;
  href: string;
  title: string;
  category: string;
  /** Couleur du chip catégorie (mapping calculé côté serveur). */
  categoryColor: string;
  /** Temps total, ex. « 40 min ». */
  totalTime?: string;
  /** Niveau, ex. « Débutant ». */
  difficulty?: string;
  imageSrc?: string;
}

interface FavorisCardProps {
  item: FavorisItem;
}

/** Horloge — puce temps de cuisson (cook-time). */
function ClockIcon() {
  return (
    <svg
      className="vgh-fav-puce-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Barres de niveau — puce difficulté (cook-difficulty). */
function LevelIcon() {
  return (
    <svg
      className="vgh-fav-puce-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 20v-6M12 20V9M19 20v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * FavorisCard — carte de la section « favoris » (`item / item-img /
 * item-content / item-footer`), fidèle au thème Yummy Bites.
 *
 * Volontairement DIFFÉRENTE de la carte d'archive (ItemCard) : pas de pastille
 * ronde centrale. À la place :
 *   - un chip catégorie `cat-links` (pastille colorée par catégorie) ;
 *   - un `item-footer` = les PUCES cook-time (horloge + durée) et
 *     cook-difficulty (niveau + libellé), petites, icône + texte alignés.
 */
export function FavorisCard({ item }: FavorisCardProps) {
  const hasFooter = Boolean(item.totalTime || item.difficulty);

  return (
    <article className="vgh-fav-card item">
      <div className="vgh-fav-img item-img">
        <Link href={item.href}>
          <SmartImage
            src={item.imageSrc}
            alt={item.title}
            ratio="4 / 3"
            className="vgh-fav-photo"
          />
        </Link>
      </div>

      <div className="vgh-fav-body item-content">
        <span
          className="vgh-fav-cat cat-links"
          style={{ backgroundColor: item.categoryColor }}
        >
          {item.category}
        </span>
        <h3 className="vgh-fav-title item-title">
          <Link href={item.href}>{item.title}</Link>
        </h3>

        {hasFooter && (
          <div className="vgh-fav-footer item-footer">
            {item.totalTime && (
              <span className="vgh-fav-puce cook-time">
                <ClockIcon />
                <span className="vgh-fav-puce-text">{formatDureeFr(item.totalTime)}</span>
              </span>
            )}
            {item.difficulty && (
              <span className="vgh-fav-puce cook-difficulty">
                <LevelIcon />
                <span className="vgh-fav-puce-text">{item.difficulty}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
