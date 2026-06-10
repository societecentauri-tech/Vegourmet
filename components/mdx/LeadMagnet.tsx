"use client";

import { useState } from "react";
import { DownloadModal } from "@/components/ressources/DownloadModal";
import "./lead-magnet.css";

export interface LeadMagnetProps {
  /** Titre du lead magnet (affiché dans l'encart et la modale). */
  title: string;
  /** Description / promesse de la ressource. */
  description: string;
  /** Slug de la ressource dans `media_ressources` (ouvre la modale e-mail). */
  webhookSlug?: string;
  /** Lien de téléchargement direct (fallback si pas de `webhookSlug`). */
  href?: string;
  /** Libellé du bouton (défaut : « Je télécharge le guide gratuit »). */
  ctaLabel?: string;
}

/**
 * LeadMagnet — encart éditorial de capture (système ressources Vegourmet).
 *
 * - `webhookSlug` → ouvre la modale `DownloadModal` (email → n8n → PDF par mail).
 * - `href` seul → lien de téléchargement direct.
 * - aucun des deux → bouton désactivé (garde-fou rédactionnel).
 *
 * Style standalone Vegourmet (`vg-lm-*`), persona « Chloé » tutoyée. Pas de
 * dépendance au DS Centauri.
 */
export function LeadMagnet({
  title,
  description,
  webhookSlug,
  href,
  ctaLabel = "Je télécharge le guide gratuit",
}: LeadMagnetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside
        className="vg-lm"
        role="region"
        aria-label="Ressource à télécharger"
      >
        <span className="vg-lm-gift" aria-hidden="true">
          🎁
        </span>
        <div className="vg-lm-body">
          <h3 className="vg-lm-title">{title}</h3>
          <p className="vg-lm-desc">{description}</p>
        </div>
        {webhookSlug ? (
          <button
            type="button"
            className="vg-lm-cta"
            onClick={() => setIsOpen(true)}
          >
            {ctaLabel}
          </button>
        ) : href ? (
          <a className="vg-lm-cta" href={href} rel="noopener noreferrer">
            {ctaLabel}
          </a>
        ) : (
          <button type="button" className="vg-lm-cta" disabled>
            {ctaLabel}
          </button>
        )}
      </aside>

      {webhookSlug && (
        <DownloadModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          resourceTitle={title}
          webhookSlug={webhookSlug}
        />
      )}
    </>
  );
}
