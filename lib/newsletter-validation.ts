// ─────────────────────────────────────────────────────────────────────────────
// Fonctions pures de validation de la newsletter (pas de réseau, pas de BDD).
// Importables côté route ET côté tests unitaires (node:test sans mock).
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SubscribeValidInput {
  email: string;
  firstName?: string;
  consentWording: string;
  source?: string;
}

export type ValidationResult =
  | { ok: true; data: Required<Pick<SubscribeValidInput, "email" | "consentWording">> & { firstName?: string; source: string } }
  | { ok: false; reason: "email_invalid" | "email_too_long" | "consent_missing" | "first_name_too_long" | "source_too_long" };

/**
 * Valide les paramètres d'inscription newsletter.
 * Fonction pure : aucun I/O, aucun appel réseau.
 */
export function validateSubscribeInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "email_invalid" };
  }
  const body = raw as Record<string, unknown>;

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : undefined;
  const consentWording =
    typeof body.consentWording === "string" ? body.consentWording.trim() : "";
  const source =
    typeof body.source === "string" ? body.source.trim() : "homepage";

  if (!EMAIL_RE.test(email)) return { ok: false, reason: "email_invalid" };
  if (email.length > 254) return { ok: false, reason: "email_too_long" };
  if (!consentWording || consentWording.length < 5)
    return { ok: false, reason: "consent_missing" };
  if (firstName && firstName.length > 80)
    return { ok: false, reason: "first_name_too_long" };
  if (source.length > 80) return { ok: false, reason: "source_too_long" };

  return {
    ok: true,
    data: {
      email: email.toLowerCase(),
      firstName,
      consentWording,
      source,
    },
  };
}

export interface UnsubscribeValidInput {
  email: string;
}

export type UnsubscribeValidationResult =
  | { ok: true; email: string }
  | { ok: false; reason: "email_invalid" | "email_too_long" };

/**
 * Valide les paramètres de désabonnement newsletter.
 * Fonction pure.
 */
export function validateUnsubscribeInput(raw: unknown): UnsubscribeValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "email_invalid" };
  }
  const body = raw as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!EMAIL_RE.test(email)) return { ok: false, reason: "email_invalid" };
  if (email.length > 254) return { ok: false, reason: "email_too_long" };

  return { ok: true, email: email.toLowerCase() };
}
