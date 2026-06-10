"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import "./download-modal.css";

// Trailing slash obligatoire : le site est en `trailingSlash: true`. Sans le
// slash, Next renvoie un 308 vers `/api/ressource/` et perd le corps du POST.
const ENDPOINT = "/api/ressource/";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "loading" | "success" | "error";

export interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Titre de la ressource (affiché dans le corps de la modale). */
  resourceTitle: string;
  /** Slug de la ressource dans `media_ressources` (ex. `guide-achat-margarine`). */
  webhookSlug: string;
}

/**
 * DownloadModal — capture l'email + consentement et POST `/api/ressource`.
 *
 * Style standalone Vegourmet (classes `vg-dlm-*`), persona « Chloé » tutoyée.
 * Le PDF n'est jamais servi ici : n8n envoie un email avec le lien
 * `/api/download?token=<uuid>` (double opt-in léger contre l'énumération).
 */
export function DownloadModal({
  isOpen,
  onClose,
  resourceTitle,
  webhookSlug,
}: DownloadModalProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fermeture clavier (Escape) + focus initial sur le bouton de fermeture.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Réinitialise l'état à la fermeture.
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setConsent(false);
      setStatus("idle");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Entre une adresse e-mail valide.");
      return;
    }
    if (!consent) {
      setError("Coche la case de consentement pour recevoir le guide.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, ressource_slug: webhookSlug }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Trop de demandes — réessaie dans une heure.");
        }
        throw new Error(`Erreur ${res.status}`);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message.startsWith("Trop")
          ? err.message
          : "Une erreur est survenue. Réessaie dans quelques instants.",
      );
    }
  }

  return (
    <div
      className="vg-dlm-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === dialogRef.current?.parentElement) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="vg-dlm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vg-dlm-title"
      >
        <button
          ref={closeRef}
          type="button"
          className="vg-dlm-close"
          aria-label="Fermer"
          onClick={onClose}
        >
          ×
        </button>

        {status === "success" ? (
          <div className="vg-dlm-success" role="status">
            <span className="vg-dlm-success-emoji" aria-hidden="true">
              💚
            </span>
            <h3 id="vg-dlm-title">C&apos;est parti !</h3>
            <p>
              Je viens de t&apos;envoyer le guide par e-mail. Jette un œil à ta
              boîte de réception (et à tes spams, on ne sait jamais) dans
              quelques minutes.
            </p>
          </div>
        ) : (
          <>
            <h3 id="vg-dlm-title" className="vg-dlm-title">
              Reçois ton guide gratuit
            </h3>
            <p className="vg-dlm-lead">
              Laisse-moi ton e-mail et je t&apos;envoie «&nbsp;
              <strong>{resourceTitle}</strong>&nbsp;» directement dans ta boîte
              mail.
            </p>

            <form className="vg-dlm-form" onSubmit={handleSubmit} noValidate>
              <label className="vg-sr-only" htmlFor="vg-dlm-email">
                Adresse e-mail
              </label>
              <input
                id="vg-dlm-email"
                type="email"
                name="email"
                placeholder="ton@email.com"
                autoComplete="email"
                required
                value={email}
                disabled={status === "loading"}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                  if (error) setError("");
                }}
              />

              <label className="vg-dlm-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={status === "loading"}
                  onChange={(ev) => setConsent(ev.target.checked)}
                  required
                />
                <span>
                  J&apos;accepte de recevoir ce guide et la newsletter Vegourmet.
                  Désinscription possible à tout moment. Voir la{" "}
                  <a href="/mentions-legales-politique-de-confidentialite/">
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>

              {error && (
                <p className="vg-dlm-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="vg-dlm-submit"
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Envoi en cours…"
                  : "Je reçois le guide"}
              </button>

              <p className="vg-dlm-note">
                Pas de spam, promis. Juste mes meilleurs guides véganes.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
