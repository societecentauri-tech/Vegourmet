"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./cookie-consent.css";

// ─────────────────────────────────────────────────────────────────────────────
// Bandeau de consentement cookies — conforme aux recommandations CNIL.
//
// Exigences couvertes :
//   - Bouton « Tout refuser » au MÊME niveau (visuel + hiérarchie) que
//     « Tout accepter » (CNIL : le refus doit être aussi simple que l'accord).
//   - Panneau « Personnaliser » par catégorie (mesure d'audience, affiliation,
//     réseaux sociaux) avec choix granulaire opt-in (désactivé par défaut).
//   - Consentement mémorisé dans un cookie first-party (`vegourmet_consent`,
//     6 mois) — aucune catégorie non essentielle n'est active sans accord
//     explicite (serviceDefaultState = refusé).
//   - Possibilité de rouvrir le panneau à tout moment via le lien « Gérer mes
//     cookies » du footer (événement `window` + hash `#cookies`).
//
// Implémentation volontairement SANS dépendance externe (équivalent léger de
// Tarteaucitron) : le site est 100 % statique avec une CSP stricte
// (`script-src 'self'`, `connect-src 'self'`), incompatible avec le chargement
// d'un script de consentement depuis un CDN tiers. Aucun service tiers n'est
// encore branché (Google Analytics « à venir ») : ce socle pose le cadre du
// recueil de consentement, à câbler sur chaque service le moment venu.
// ─────────────────────────────────────────────────────────────────────────────

const CONSENT_COOKIE = "vegourmet_consent";
const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE = 60 * 60 * 24 * 183; // ~6 mois en secondes

/** Catégories de cookies non essentiels soumises au consentement. */
const CATEGORIES = [
  {
    id: "analytics",
    label: "Mesure d'audience",
    description:
      "Statistiques de fréquentation (Google Analytics) pour améliorer le site. À venir.",
  },
  {
    id: "affiliation",
    label: "Liens d'affiliation",
    description:
      "Suivi des liens vers nos partenaires (ex. Greenweez) lorsque vous cliquez dessus.",
  },
  {
    id: "social",
    label: "Réseaux sociaux",
    description:
      "Modules et liens vers Facebook, Pinterest, Instagram et X/Twitter.",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type Choices = Record<CategoryId, boolean>;

const ALL_FALSE: Choices = { analytics: false, affiliation: false, social: false };
const ALL_TRUE: Choices = { analytics: true, affiliation: true, social: true };

interface StoredConsent {
  v: number;
  choices: Choices;
}

/** Événement custom permettant au footer d'ouvrir le panneau de réglages. */
export const COOKIE_MANAGE_EVENT = "vegourmet:open-cookie-settings";

function readConsent(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.v !== CONSENT_VERSION || typeof parsed.choices !== "object") {
      return null;
    }
    return {
      v: CONSENT_VERSION,
      choices: {
        analytics: Boolean(parsed.choices?.analytics),
        affiliation: Boolean(parsed.choices?.affiliation),
        social: Boolean(parsed.choices?.social),
      },
    };
  } catch {
    return null;
  }
}

function writeConsent(choices: Choices): void {
  const payload: StoredConsent = { v: CONSENT_VERSION, choices };
  const value = encodeURIComponent(JSON.stringify(payload));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function CookieConsent() {
  // `visible` = bandeau affiché (premier passage OU réouverture via footer).
  const [visible, setVisible] = useState(false);
  // `details` = panneau « Personnaliser » déplié.
  const [details, setDetails] = useState(false);
  const [choices, setChoices] = useState<Choices>(ALL_FALSE);
  const panelRef = useRef<HTMLDivElement>(null);

  // Au montage : afficher le bandeau uniquement si aucun consentement valide.
  useEffect(() => {
    const stored = readConsent();
    if (!stored) {
      setVisible(true);
    } else {
      setChoices(stored.choices);
    }
  }, []);

  // Réouverture depuis le footer (« Gérer mes cookies »).
  useEffect(() => {
    const open = () => {
      const stored = readConsent();
      if (stored) setChoices(stored.choices);
      setDetails(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_MANAGE_EVENT, open);
    // Support du lien direct #cookies (ex. depuis une page légale).
    if (window.location.hash === "#cookies") open();
    return () => window.removeEventListener(COOKIE_MANAGE_EVENT, open);
  }, []);

  const persist = useCallback((next: Choices) => {
    writeConsent(next);
    setChoices(next);
    setVisible(false);
    setDetails(false);
  }, []);

  const acceptAll = useCallback(() => persist(ALL_TRUE), [persist]);
  const denyAll = useCallback(() => persist(ALL_FALSE), [persist]);
  const saveChoices = useCallback(() => persist(choices), [persist, choices]);

  const toggle = useCallback((id: CategoryId) => {
    setChoices((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!visible) return null;

  return (
    <div
      className="vg-cookie"
      role="dialog"
      aria-modal="false"
      aria-labelledby="vg-cookie-title"
      aria-describedby="vg-cookie-desc"
      ref={panelRef}
    >
      <div className="vg-cookie-inner">
        <div className="vg-cookie-head">
          <h2 id="vg-cookie-title" className="vg-cookie-title">
            🍪 Vos préférences de cookies
          </h2>
          <p id="vg-cookie-desc" className="vg-cookie-text">
            Nous utilisons des cookies pour mesurer l&apos;audience, gérer les
            liens d&apos;affiliation et les contenus de réseaux sociaux. Vous
            pouvez tout accepter, tout refuser, ou choisir précisément. Les
            cookies strictement nécessaires au fonctionnement du site sont
            toujours actifs. En savoir plus dans nos{" "}
            <Link
              href="/mentions-legales-politique-de-confidentialite"
              className="vg-cookie-link"
            >
              mentions légales &amp; politique de confidentialité
            </Link>
            .
          </p>
        </div>

        {details && (
          <ul className="vg-cookie-cats">
            <li className="vg-cookie-cat vg-cookie-cat--locked">
              <div className="vg-cookie-cat-info">
                <span className="vg-cookie-cat-label">
                  Strictement nécessaires
                </span>
                <span className="vg-cookie-cat-desc">
                  Indispensables au fonctionnement du site (mémorisation de vos
                  choix de cookies). Toujours actifs.
                </span>
              </div>
              <span className="vg-cookie-badge">Toujours actif</span>
            </li>

            {CATEGORIES.map((cat) => (
              <li key={cat.id} className="vg-cookie-cat">
                <div className="vg-cookie-cat-info">
                  <span className="vg-cookie-cat-label">{cat.label}</span>
                  <span className="vg-cookie-cat-desc">{cat.description}</span>
                </div>
                <label className="vg-cookie-switch">
                  <input
                    type="checkbox"
                    checked={choices[cat.id]}
                    onChange={() => toggle(cat.id)}
                    aria-label={`Activer les cookies : ${cat.label}`}
                  />
                  <span className="vg-cookie-slider" aria-hidden="true" />
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="vg-cookie-actions">
          {/* « Refuser » et « Accepter » au même niveau visuel (exigence CNIL). */}
          <button
            type="button"
            className="vg-cookie-btn vg-cookie-btn--deny"
            onClick={denyAll}
          >
            Tout refuser
          </button>
          {details ? (
            <button
              type="button"
              className="vg-cookie-btn vg-cookie-btn--save"
              onClick={saveChoices}
            >
              Enregistrer mes choix
            </button>
          ) : (
            <button
              type="button"
              className="vg-cookie-btn vg-cookie-btn--custom"
              onClick={() => setDetails(true)}
            >
              Personnaliser
            </button>
          )}
          <button
            type="button"
            className="vg-cookie-btn vg-cookie-btn--accept"
            onClick={acceptAll}
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
