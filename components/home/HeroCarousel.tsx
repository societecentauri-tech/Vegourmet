"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";

/** Slide du carrousel hero — données déjà mappées côté serveur (plain object). */
export interface HeroSlide {
  /** Slug recette (clé React + URL). */
  slug: string;
  /** Titre affiché (item-title). */
  title: string;
  /** Extrait court (item-content). */
  excerpt: string;
  /** Libellé de catégorie pour le chip cat-links. */
  category: string;
  /** Couleur du chip catégorie (issue du mapping côté serveur). */
  categoryColor: string;
  /** URL de l'image hero (bucket S3). */
  imageSrc?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const AUTOPLAY_MS = 5000;

/**
 * HeroCarousel — carrousel d'ouverture (`site-banner banner-slider style-one`).
 * Reproduit le owl-carousel officiel sans dépendance externe :
 * autoplay 5 s, flèches prev/next (owl-nav), dots (owl-dots), pause au hover,
 * transition fade entre slides, accessible (aria-label, boutons focusables).
 */
export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const baseId = useId();

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + count) % count);
    },
    [count],
  );

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  // Autoplay : avance toutes les AUTOPLAY_MS, suspendu au hover/focus.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <section
      className="vgh-banner site-banner banner-slider style-one"
      aria-roledescription="carousel"
      aria-label="Recettes à la une"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="vgh-container">
        <div className="vgh-banner-viewport">
          {slides.map((slide, i) => (
            <article
              key={slide.slug}
              className={`vgh-banner-item item${i === index ? " is-active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${count}`}
              aria-hidden={i === index ? undefined : true}
              id={`${baseId}-slide-${i}`}
            >
              <div className="vgh-banner-img item-img">
                <Link href={`/recettes/${slide.slug}`} tabIndex={i === index ? 0 : -1}>
                  <SmartImage
                    src={slide.imageSrc}
                    alt={slide.title}
                    ratio="4 / 3"
                    className="vgh-banner-photo"
                  />
                </Link>
              </div>
              <div className="vgh-banner-caption banner-caption">
                <span
                  className="vgh-banner-cat cat-links"
                  style={{ backgroundColor: slide.categoryColor }}
                >
                  {slide.category}
                </span>
                <h2 className="vgh-banner-title item-title">
                  <Link
                    href={`/recettes/${slide.slug}`}
                    tabIndex={i === index ? 0 : -1}
                  >
                    {slide.title}
                  </Link>
                </h2>
                <p className="vgh-banner-content item-content">{slide.excerpt}</p>
                <Link
                  href={`/recettes/${slide.slug}`}
                  className="btn-primary vgh-banner-btn"
                  tabIndex={i === index ? 0 : -1}
                >
                  Voir la recette
                </Link>
              </div>
            </article>
          ))}
        </div>

        {count > 1 && (
          <>
            <div className="vgh-banner-nav owl-nav">
              <button
                type="button"
                className="vgh-banner-arrow owl-prev"
                onClick={prev}
                aria-label="Recette précédente"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="vgh-banner-arrow owl-next"
                onClick={next}
                aria-label="Recette suivante"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="vgh-banner-dots owl-dots" role="tablist" aria-label="Choisir une recette">
              {slides.map((slide, i) => (
                <button
                  key={slide.slug}
                  type="button"
                  className={`vgh-banner-dot${i === index ? " is-active" : ""}`}
                  aria-label={`Aller à la recette ${i + 1}`}
                  aria-selected={i === index}
                  role="tab"
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
