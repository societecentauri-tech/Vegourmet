// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès serveur (BFF) à la table newsletter_subscribers de vegourmet_prod.
//
// server-only : utilise la clé service_role Supabase. Ne JAMAIS importer côté
// client. Tout passe par la route API `app/api/newsletter` (standard BFF Centauri).
// PostgREST derrière Kong : header `apikey` OBLIGATOIRE + `Authorization: Bearer`.
// ─────────────────────────────────────────────────────────────────────────────

import { COMMENTS_API_URL } from "./comments-backend";

/** Texte de consentement canonique (preuve RGPD, défini côté serveur). */
export const NEWSLETTER_CONSENT_TEXT =
  "J'accepte de recevoir la newsletter de Vegourmet (recettes, conseils et offres) " +
  "et que mon adresse e-mail soit utilisée à cette fin. Désinscription possible à tout moment.";

function serviceKey(): string {
  const raw =
    process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) {
    throw new Error(
      "SUPABASE_SERVICE_KEY manquant : inscription newsletter impossible.",
    );
  }
  return raw.trim();
}

function authHeaders(): Record<string, string> {
  const key = serviceKey();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export interface NewsletterInput {
  email: string;
  firstName?: string;
  source?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

/**
 * Inscrit une adresse à la newsletter (single opt-in avec consentement explicite).
 * Idempotent : une adresse déjà présente renvoie `alreadySubscribed: true`.
 */
export async function subscribeToNewsletter(
  input: NewsletterInput,
): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  const body = {
    email,
    first_name: input.firstName?.trim() || null,
    consent: true,
    consent_text: NEWSLETTER_CONSENT_TEXT,
    source: input.source?.trim() || "homepage",
    ip_address: input.ip || null,
    user_agent: input.userAgent || null,
    status: "subscribed",
  };

  const res = await fetch(`${COMMENTS_API_URL}/rest/v1/newsletter_subscribers`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 201) {
    return { ok: true, alreadySubscribed: false };
  }

  // 409 = violation d'unicité (lower(email)) → déjà inscrit·e (idempotent).
  if (res.status === 409) {
    return { ok: true, alreadySubscribed: true };
  }

  const detail = await res.text().catch(() => "");
  return {
    ok: false,
    error: `Inscription refusée (HTTP ${res.status}) ${detail}`.trim(),
  };
}
