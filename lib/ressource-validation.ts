// ─────────────────────────────────────────────────────────────────────────────
// Validation pure des entrées du système LeadMagnet (ressource + download).
//
// Fonctions sans I/O ni réseau, extraites des routes API pour être testables
// unitairement (règle no-mocks : pas de simulation de webhook n8n, on ne teste
// que la logique de validation).
// ─────────────────────────────────────────────────────────────────────────────

/** Validation e-mail simple et robuste (alignée sur /api/newsletter). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Slug de ressource : minuscules, chiffres et tirets uniquement.
 * Correspond aux `slug` de `media_ressources` (ex. `guide-achat-margarine`).
 */
const SLUG_RE = /^[a-z0-9-]+$/;

/** Format UUID v4-ish (token de téléchargement émis par n8n). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RessourceRequestInput {
  email: string;
  ressource_slug: string;
}

export type RessourceValidation =
  | { ok: true; value: RessourceRequestInput }
  | { ok: false; reason: "email_invalid" | "slug_invalid" | "body_malformed" };

/**
 * Valide le corps POST de `/api/ressource`.
 * @param body Corps JSON déjà parsé (ou `unknown` si parse échoué amont).
 */
export function validateRessourceRequest(body: unknown): RessourceValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, reason: "body_malformed" };
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const ressource_slug =
    typeof record.ressource_slug === "string"
      ? record.ressource_slug.trim()
      : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, reason: "email_invalid" };
  }
  if (
    ressource_slug.length === 0 ||
    ressource_slug.length > 200 ||
    !SLUG_RE.test(ressource_slug)
  ) {
    return { ok: false, reason: "slug_invalid" };
  }

  return { ok: true, value: { email, ressource_slug } };
}

/** Vrai si `token` est un UUID bien formé. */
export function isValidToken(token: string | null | undefined): token is string {
  return typeof token === "string" && UUID_RE.test(token);
}

/**
 * Hosts autorisés pour la redirection finale du téléchargement.
 * Défense en profondeur : si n8n était compromis, empêche un open-redirect
 * vers du phishing en bloquant tout host hors Vegourmet.
 */
export const ALLOWED_REDIRECT_HOSTS: ReadonlySet<string> = new Set([
  "vegourmet.fr",
  "www.vegourmet.fr",
  "static.vegourmet.fr",
]);

/**
 * Vérifie qu'une URL de redirection pointe vers un host allowlisté.
 * @returns le host extrait si autorisé, sinon `null` (URL invalide ou host interdit).
 */
export function allowedRedirectHost(location: string): string | null {
  let host: string;
  try {
    host = new URL(location).hostname;
  } catch {
    return null;
  }
  return ALLOWED_REDIRECT_HOSTS.has(host) ? host : null;
}
