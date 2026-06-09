"use client";

/**
 * Analytics.tsx — Chargement GA4 conditionné au consentement RGPD.
 *
 * Ne charge aucun script Google tant que l'utilisateur n'a pas accordé la
 * catégorie "analytics" dans la bannière cookies (cookie `vegourmet_consent`).
 * Écoute l'événement `vegourmet:consent-update` pour réagir en temps réel.
 *
 * Approche : injection manuelle via document.createElement (useEffect) plutôt
 * que next/script avec children inline. Next/script inline monté dynamiquement
 * post-hydratation n'exécute pas son contenu de façon fiable → SyntaxError +
 * window.gtag jamais défini.
 */

import { useEffect } from "react";

// Measurement ID GA4 — valeur publique, non secrète.
// Propriété 466965823 (flux web Vegourmet).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-5GL00NQ73V";

const CONSENT_COOKIE = "vegourmet_consent";

/** Lit le cookie vegourmet_consent et retourne true si analytics est accordé. */
function readAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return false;
  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as {
      v?: number;
      choices?: { analytics?: boolean };
    };
    return Boolean(parsed?.choices?.analytics);
  } catch {
    return false;
  }
}

/** Injecte le script externe gtag.js + initialise dataLayer/window.gtag. */
function injectGA4(gaId: string): void {
  // Déclare window.dataLayer et window.gtag avant le script externe.
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: GtagArgs): void {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });

  // Injecte le script externe async dans <head>.
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);
}

export function Analytics() {
  useEffect(() => {
    // Flag interne : évite la double-injection si le composant est re-rendu.
    let injected = false;

    function tryInject() {
      if (!injected && readAnalyticsConsent()) {
        injected = true;
        injectGA4(GA_ID);
      }
    }

    // Vérification immédiate (visiteur revenant avec consentement déjà enregistré).
    tryInject();

    // Réaction en temps réel quand l'utilisateur accepte/refuse via la bannière.
    const handleConsentUpdate = () => {
      tryInject();
    };
    window.addEventListener("vegourmet:consent-update", handleConsentUpdate);
    return () => {
      window.removeEventListener(
        "vegourmet:consent-update",
        handleConsentUpdate
      );
    };
  }, []);

  // Ce composant ne rend rien dans le DOM.
  return null;
}
