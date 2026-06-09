"use client";

import { useRef, useState } from "react";
import "./contact-form.css";

type FormState = "idle" | "loading" | "success" | "error";

const SUBJECTS = [
  "Question sur une recette",
  "Suggestion de recette",
  "Partenariat ou collaboration",
  "Problème technique",
  "Autre",
];

/**
 * Formulaire de contact végourmet — champs nom / e-mail / sujet / message.
 * - Validation côté client avant soumission.
 * - Honeypot anti-spam (champ masqué `website`).
 * - États loading / succès / erreur gérés.
 * - Appel BFF → /api/contact (jamais de clé API exposée côté navigateur).
 */
export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot : si rempli → bot détecté, on simule un succès sans envoyer.
    if (honeypotRef.current?.value) {
      setState("success");
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = (data.get("name") as string | null)?.trim() ?? "";
    const email = (data.get("email") as string | null)?.trim() ?? "";
    const subject = (data.get("subject") as string | null)?.trim() ?? "";
    const message = (data.get("message") as string | null)?.trim() ?? "";

    // Validation côté client.
    if (!name || name.length > 100) {
      setErrorMsg("Merci d'indiquer ton prénom ou nom (100 caractères max).");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setErrorMsg("Merci d'indiquer une adresse e-mail valide.");
      return;
    }
    if (!subject) {
      setErrorMsg("Merci de choisir un sujet.");
      return;
    }
    if (!message || message.length < 10) {
      setErrorMsg("Ton message doit faire au moins 10 caractères.");
      return;
    }
    if (message.length > 3000) {
      setErrorMsg("Ton message est trop long (3 000 caractères max).");
      return;
    }

    setErrorMsg("");
    setState("loading");

    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _hp: honeypotRef.current?.value ?? "",
          _t: startTimeRef.current,
        }),
      });

      if (res.ok) {
        setState("success");
        form.reset();
      } else {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (res.status === 429) {
          setErrorMsg(
            "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.",
          );
        } else {
          setErrorMsg(
            json.error ??
              "Une erreur est survenue. Réessaie dans quelques instants.",
          );
        }
        setState("error");
      }
    } catch {
      setErrorMsg(
        "Impossible de joindre le serveur. Vérifie ta connexion et réessaie.",
      );
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="vg-contact-success"
        aria-live="polite"
      >
        <p className="vg-contact-success__icon" aria-hidden="true">
          ✓
        </p>
        <p className="vg-contact-success__title">Message envoyé !</p>
        <p className="vg-contact-success__body">
          Merci pour ton message. Je reviendrai vers toi dès que possible.
        </p>
        <button
          type="button"
          className="vg-contact-btn"
          onClick={() => setState("idle")}
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulaire de contact"
      className="vg-contact-form"
    >
      {/* Champ honeypot anti-spam — masqué visuellement et des lecteurs d'écran */}
      <div aria-hidden="true" style={{ display: "none" }}>
        <label htmlFor="website">Ne pas remplir ce champ</label>
        <input
          ref={honeypotRef}
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="vg-contact-field">
        <label htmlFor="contact-name" className="vg-contact-label">
          Nom ou prénom <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          className="vg-contact-input"
          placeholder="Chloé, Julie, Marc…"
          disabled={state === "loading"}
        />
      </div>

      <div className="vg-contact-field">
        <label htmlFor="contact-email" className="vg-contact-label">
          Adresse e-mail <span aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          className="vg-contact-input"
          placeholder="ton@email.com"
          disabled={state === "loading"}
        />
      </div>

      <div className="vg-contact-field">
        <label htmlFor="contact-subject" className="vg-contact-label">
          Sujet <span aria-hidden="true">*</span>
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          className="vg-contact-select"
          disabled={state === "loading"}
          defaultValue=""
        >
          <option value="" disabled>
            Choisis un sujet…
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="vg-contact-field">
        <label htmlFor="contact-message" className="vg-contact-label">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={6}
          className="vg-contact-textarea"
          placeholder="Écris ton message ici…"
          disabled={state === "loading"}
        />
      </div>

      {/* Erreurs (validation côté client ou réponse serveur) — assertive car l'utilisateur
          doit être averti immédiatement. Un seul bloc conditionnel évite le double rendu. */}
      {errorMsg && (
        <p role="alert" className="vg-contact-error" aria-live="assertive">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        className="vg-contact-btn"
        disabled={state === "loading"}
        aria-busy={state === "loading"}
      >
        {state === "loading" ? "Envoi en cours…" : "Envoyer mon message"}
      </button>

      <p className="vg-contact-rgpd">
        Les informations saisies sont utilisées uniquement pour répondre à ta
        demande et ne seront jamais transmises à des tiers.
      </p>
    </form>
  );
}
