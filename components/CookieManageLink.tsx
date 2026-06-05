"use client";

import { COOKIE_MANAGE_EVENT } from "./CookieConsent";

// Lien « Gérer mes cookies » du footer : rouvre le panneau de réglages du
// bandeau de consentement (CookieConsent.tsx) via un événement window.
// Isolé en composant client pour garder SiteFooter en composant serveur.
export function CookieManageLink() {
  return (
    <button
      type="button"
      className="vg-cookie-manage-link"
      onClick={() => window.dispatchEvent(new Event(COOKIE_MANAGE_EVENT))}
    >
      Gérer mes cookies
    </button>
  );
}
