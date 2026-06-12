"use client";

/**
 * Analytics.tsx — GA4 avec Consent Mode v2 (CNIL-conforme).
 *
 * Architecture :
 *   1. Le script gtag.js est TOUJOURS chargé (nécessaire pour le Consent Mode v2).
 *   2. Le consentement analytics est déclaré "denied" par défaut → GA4 ne pose
 *      aucun cookie _ga et n'envoie aucun hit individuel sans accord.
 *   3. Quand l'utilisateur accepte la catégorie "analytics" via la bannière
 *      cookies, gtag.consent('update') est appelé avec 'granted' → GA4 active
 *      la mesure complète et les modèles de conversion même sans cookie.
 *
 * Pourquoi le Consent Mode v2 vs l'ancienne approche conditionnelle :
 *   L'ancienne implémentation (PR #31-#34) ne chargeait gtag.js QUE si l'utilisateur
 *   acceptait. Résultat : 0 sessions GA4 pour les visiteurs qui refusent ou ignorent
 *   la bannière (comportement par défaut CNIL France = refus). La modélisation GA4
 *   (server-side conversion modeling) nécessite que le script soit chargé même en
 *   mode "denied" → Consent Mode v2 est la solution officielle Google/CNIL.
 *
 * Référence : https://developers.google.com/tag-platform/security/guides/consent
 */

import { useEffect } from "react";

// Measurement ID GA4 — valeur publique, non secrète.
// Propriété 466965823 (flux web Vegourmet).
// .trim() : la var d'env Vercel peut contenir un trailing newline.
const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? "G-5GL00NQ73V").trim();

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

/**
 * Initialise dataLayer, window.gtag, et configure le Consent Mode v2 par défaut.
 * Doit être appelé AVANT le chargement du script gtag.js externe.
 */
function initConsentMode(gaId: string): void {
  // Déclare window.dataLayer et window.gtag.
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: GtagArgs): void {
    window.dataLayer.push(args);
  };

  // Consent Mode v2 : toutes les catégories refusées par défaut.
  // GA4 ne posera aucun cookie et n'enverra aucun hit individuel avant accord.
  // Les modèles de conversion (aggregated measurement) restent actifs.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });

  // Charge le script gtag.js externe de façon asynchrone.
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);
}

/** Met à jour le consentement GA4 selon les choix de l'utilisateur. */
function updateConsentMode(analyticsGranted: boolean): void {
  if (typeof window.gtag !== "function") return;
  const status = analyticsGranted ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: status,
  });
}

export function Analytics() {
  useEffect(() => {
    // Initialise le Consent Mode v2 et charge le script gtag.js une seule fois.
    if (!window.dataLayer) {
      const alreadyGranted = readAnalyticsConsent();
      initConsentMode(GA_ID);
      // Si le visiteur avait déjà accepté (cookie présent), on accorde immédiatement.
      if (alreadyGranted) {
        updateConsentMode(true);
      }
    }

    // Réaction en temps réel quand l'utilisateur interagit avec la bannière.
    const handleConsentUpdate = () => {
      updateConsentMode(readAnalyticsConsent());
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
