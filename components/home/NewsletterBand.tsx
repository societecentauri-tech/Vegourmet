"use client";

import { useState, type FormEvent } from "react";

/**
 * NewsletterBand — bandeau newsletter (ancre #newsletter).
 * Inscription via BFF `POST /api/newsletter/subscribe/` → Listmonk double opt-in.
 * Affiche « Vérifie ta boîte mail pour confirmer » après soumission (voix Chloé).
 */

/** Libellé de consentement canonique envoyé côté serveur pour preuve RGPD. */
const CONSENT_WORDING =
  "J'accepte de recevoir la newsletter de Vegourmet (recettes, conseils et offres) " +
  "et que mon adresse e-mail soit utilisée à cette fin. Désinscription possible à tout moment.";

type Status = "idle" | "loading" | "success" | "already" | "error";

export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("Coche la case de consentement pour t'inscrire.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName.trim() || undefined,
          consentWording: CONSENT_WORDING,
          source: "homepage",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        alreadySubscribed?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Une erreur est survenue. Réessaie plus tard.");
        return;
      }

      setStatus(data.alreadySubscribed ? "already" : "success");
      setEmail("");
      setFirstName("");
      setConsent(false);
    } catch {
      setStatus("error");
      setError("Impossible de t'inscrire pour le moment. Réessaie plus tard.");
    }
  }

  const done = status === "success" || status === "already";

  return (
    <section
      id="newsletter"
      className="vgh-newsletter"
      aria-labelledby="vgh-newsletter-title"
    >
      <div className="vgh-container vgh-newsletter-inner">
        <div className="vgh-newsletter-text">
          <h3 id="vgh-newsletter-title">Abonne-toi à notre newsletter</h3>
          <p>
            Reçois nos dernières recettes, conseils de cuisine et offres
            exclusives directement dans ta boîte de réception.
          </p>
        </div>

        {done ? (
          <p className="vgh-newsletter-success" role="status">
            {status === "already"
              ? "Tu es déjà inscrit·e — merci ! 💚"
              : "C'est presque fait ! Vérifie ta boîte mail et clique sur le lien de confirmation. 💚"}
          </p>
        ) : (
          <form
            className="vgh-newsletter-form"
            aria-label="Inscription à la newsletter"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="vgh-newsletter-fields">
              <label className="vgh-sr-only" htmlFor="vgh-nl-email">
                Adresse e-mail
              </label>
              <input
                id="vgh-nl-email"
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="vgh-sr-only" htmlFor="vgh-nl-fname">
                Prénom
              </label>
              <input
                id="vgh-nl-fname"
                type="text"
                name="fname"
                placeholder="Prénom (facultatif)"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Inscription…" : "S'inscrire"}
              </button>
            </div>

            <label className="vgh-newsletter-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                J&apos;accepte de recevoir la newsletter de Vegourmet et que mon
                adresse soit utilisée à cette fin. Désinscription possible à tout
                moment. Voir la{" "}
                <a href="/mentions-legales-politique-de-confidentialite/">
                  politique de confidentialité
                </a>
                .
              </span>
            </label>

            {error && (
              <p className="vgh-newsletter-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
