"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Section « Avis » sous la fiche recette (client).
//
// - Liste paginée des avis approuvés (GET /api/comments?slug=&page=N).
// - Formulaire d'ajout (POST /api/comments) → avis en modération (`pending`).
//
// IMPORTANT — BFF strict : ce composant ne parle JAMAIS à PostgREST/Supabase.
// Il consomme uniquement les routes API Next.js, qui détiennent la service_role.
// Aucun secret ni email hash ne transite ici.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useId, useState } from "react";
import { StarRating } from "./StarRating";
import type { RecipeRating } from "@/lib/ratings";

interface ApiReply {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface ApiComment {
  id: string;
  authorName: string;
  content: string;
  rating: number | null;
  createdAt: string;
  /** Réponses d'auteur (Chloé) imbriquées sous cet avis. */
  replies?: ApiReply[];
}

interface CommentsResponse {
  /** Avis de premier niveau (notés) de la page courante, réponses incluses. */
  comments: ApiComment[];
  /** Nombre d'avis de premier niveau (PAS le total commentaires + réponses). */
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface RecipeReviewsProps {
  slug: string;
  /** Note agrégée (snapshot SSR) — sert d'affichage initial avant hydratation. */
  rating?: RecipeRating | null;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function RecipeReviews({ slug, rating }: RecipeReviewsProps) {
  const formId = useId();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // État du formulaire.
  const [name, setName] = useState("");
  const [stars, setStars] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(
          `/api/comments?slug=${encodeURIComponent(slug)}&page=${p}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CommentsResponse;
        setData(json);
      } catch {
        setLoadError(true);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setSubmitMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          authorName: name,
          rating: stars,
          content,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setSubmitErr(json.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      setSubmitMsg(
        json.message ??
          "Merci ! Ton avis sera publié après modération.",
      );
      setName("");
      setContent("");
      setStars(5);
    } catch {
      setSubmitErr("Réseau indisponible. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  // Compteur = nombre d'AVIS (premier niveau = notés), JAMAIS le total
  // commentaires + réponses. Source prioritaire : `rating.ratingCount` du
  // snapshot (cohérent avec l'aggregateRating JSON-LD). À défaut, `data.total`
  // (avis de premier niveau renvoyés par l'API threadée). On n'utilise PLUS
  // `reviewCount` (= total à plat, incluait les réponses de Chloé → « (20) »).
  const reviewCount =
    rating && rating.ratingCount > 0 ? rating.ratingCount : total;
  const heading = reviewCount > 0 ? `Avis (${reviewCount})` : "Avis";

  return (
    <section id="avis" className="vg-reviews" aria-labelledby={`${formId}-title`}>
      <div className="vg-reviews__head">
        <h2 className="vg-reviews__title" id={`${formId}-title`}>
          {heading}
        </h2>
        {rating && rating.ratingCount > 0 && (
          <span className="vg-reviews__avg">
            <StarRating value={rating.ratingValue} size={18} />
            <strong>
              {rating.ratingValue.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              })}
            </strong>
            <span className="vg-reviews__avg-sub">sur 5</span>
          </span>
        )}
      </div>

      {/* Liste des avis */}
      {loading && !data && (
        <p className="vg-reviews__muted">Chargement des avis…</p>
      )}
      {loadError && (
        <p className="vg-reviews__muted">
          Les avis n’ont pas pu être chargés. Réessaie plus tard.
        </p>
      )}
      {data && data.comments.length === 0 && !loadError && (
        <p className="vg-reviews__muted">
          Aucun avis pour l’instant. Sois la première personne à en laisser un !
        </p>
      )}

      {data && data.comments.length > 0 && (
        <ul className="vg-reviews__list">
          {data.comments.map((c) => (
            <li className="vg-review" key={c.id}>
              <div className="vg-review__head">
                <span className="vg-review__author">{c.authorName}</span>
                {c.rating != null && c.rating > 0 && (
                  <StarRating value={c.rating} size={14} />
                )}
                {c.createdAt && (
                  <time className="vg-review__date" dateTime={c.createdAt}>
                    {formatDate(c.createdAt)}
                  </time>
                )}
              </div>
              <p className="vg-review__content">{c.content}</p>

              {/* Réponse(s) d'auteur (Chloé) imbriquée(s) sous l'avis, sans étoiles. */}
              {c.replies && c.replies.length > 0 && (
                <ul className="vg-review__replies">
                  {c.replies.map((r) => (
                    <li className="vg-reply" key={r.id}>
                      <div className="vg-reply__head">
                        <span className="vg-reply__badge">Réponse de</span>
                        <span className="vg-reply__author">{r.authorName}</span>
                        {r.createdAt && (
                          <time className="vg-reply__date" dateTime={r.createdAt}>
                            {formatDate(r.createdAt)}
                          </time>
                        )}
                      </div>
                      <p className="vg-reply__content">{r.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="vg-reviews__pager" aria-label="Pagination des avis">
          <button
            type="button"
            className="vg-reviews__pgbtn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Précédent
          </button>
          <span className="vg-reviews__pginfo">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="vg-reviews__pgbtn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant →
          </button>
        </nav>
      )}

      {/* Formulaire d'ajout */}
      <form className="vg-reviewform" onSubmit={handleSubmit} noValidate>
        <h3 className="vg-reviewform__title">Laisser un avis</h3>

        <div className="vg-reviewform__row">
          <label className="vg-reviewform__label" htmlFor={`${formId}-name`}>
            Ton prénom
          </label>
          <input
            id={`${formId}-name`}
            className="vg-reviewform__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            autoComplete="given-name"
          />
        </div>

        <div className="vg-reviewform__row">
          <span className="vg-reviewform__label">Ta note</span>
          <span
            className="vg-reviewform__stars"
            role="radiogroup"
            aria-label="Note de 1 à 5 étoiles"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                className={
                  n <= stars
                    ? "vg-reviewform__star is-on"
                    : "vg-reviewform__star"
                }
                onClick={() => setStars(n)}
              >
                ★
              </button>
            ))}
          </span>
        </div>

        <div className="vg-reviewform__row">
          <label
            className="vg-reviewform__label"
            htmlFor={`${formId}-content`}
          >
            Ton avis
          </label>
          <textarea
            id={`${formId}-content`}
            className="vg-reviewform__textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={4000}
            required
          />
        </div>

        {submitErr && (
          <p className="vg-reviewform__error" role="alert">
            {submitErr}
          </p>
        )}
        {submitMsg && (
          <p className="vg-reviewform__success" role="status">
            {submitMsg}
          </p>
        )}

        <button
          type="submit"
          className="vg-reviewform__submit"
          disabled={submitting}
        >
          {submitting ? "Envoi…" : "Publier mon avis"}
        </button>
      </form>
    </section>
  );
}
