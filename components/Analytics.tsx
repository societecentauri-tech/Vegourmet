"use client";

/**
 * Analytics.tsx — Chargement GA4 conditionné au consentement RGPD.
 *
 * Ne monte aucun script Google tant que l'utilisateur n'a pas accepté la
 * catégorie "analytics" dans la bannière cookies (cookie `vegourmet_consent`).
 * Écoute l'événement `vegourmet:consent-update` pour réagir en temps réel sans
 * polling.
 *
 * Approche : montage conditionnel du script gtag via `next/script` (strategy
 * "afterInteractive") — aucun cookie _ga ni requête vers googletagmanager.com
 * avant accord explicite.
 */

import Script from "next/script";
import { useEffect, useState } from "react";

// Measurement ID GA4 — valeur publique, non secrète.
// Propriété 466965823 (flux web Vegourmet, ancienne propriété avec historique).
const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID ?? "G-5GL00NQ73V";

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

export function Analytics() {
  const [analyticsGranted, setAnalyticsGranted] = useState(false);

  useEffect(() => {
    // Lecture initiale du cookie (ex. visiteur revenant avec consentement).
    setAnalyticsGranted(readAnalyticsConsent());

    // Réaction en temps réel quand l'utilisateur donne/retire son consentement
    // via la bannière CookieConsent (event dispatché dans persist()).
    const handleConsentUpdate = () => {
      setAnalyticsGranted(readAnalyticsConsent());
    };
    window.addEventListener("vegourmet:consent-update", handleConsentUpdate);
    return () => {
      window.removeEventListener(
        "vegourmet:consent-update",
        handleConsentUpdate
      );
    };
  }, []);

  // Pas de consentement analytics → aucun script, aucune requête Google.
  if (!analyticsGranted) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="vg-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
