// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès serveur (BFF) vers le BFF Listmonk interne.
//
// server-only : jamais importé côté client.
// Tout trafic passe par les routes API Next.js (standard BFF Centauri bff-2026.md).
//
// Le BFF Listmonk (listmonk-bff.alpha.cntri.cloud) expose un contrat simplifié
// sécurisé par header X-Listmonk-BFF-Key. Listmonk lui-même n'est pas exposé
// directement — aucune HTTP Basic auth ici.
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";

// ── Configuration ────────────────────────────────────────────────────────────

interface BffConfig {
  baseUrl: string;
  key: string;
  listUuid: string;
}

function bffConfig(): BffConfig {
  const baseUrl = process.env.LISTMONK_BFF_URL;
  const key = process.env.LISTMONK_BFF_KEY;
  const listUuid = process.env.LISTMONK_LIST_UUID_VEGOURMET;

  if (!baseUrl || !key || !listUuid) {
    throw new Error(
      "Config BFF Listmonk incomplète : LISTMONK_BFF_URL, LISTMONK_BFF_KEY " +
        "et LISTMONK_LIST_UUID_VEGOURMET sont requis.",
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), key, listUuid };
}

// ── Types de réponse BFF ─────────────────────────────────────────────────────

/** Réponse de POST /subscribe */
interface BffSubscribeResponse {
  data: { has_optin: boolean };
}

/** Réponse de GET /subscriber */
interface BffSubscriberFoundResponse {
  exists: true;
  id: number;
  status: "enabled" | "disabled" | "blocklisted";
  list_subscription_status: "unconfirmed" | "confirmed" | "unsubscribed";
}

interface BffSubscriberNotFoundResponse {
  exists: false;
}

type BffSubscriberResponse = BffSubscriberFoundResponse | BffSubscriberNotFoundResponse;

/** Réponse de POST /unsubscribe */
interface BffUnsubscribeResponse {
  status: "unsubscribed";
  email: string;
}

// ── Résultats publics ────────────────────────────────────────────────────────

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

export type UnsubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

// ── Helper fetch ─────────────────────────────────────────────────────────────

async function bffFetch(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const { baseUrl, key } = bffConfig();
  const headers = new Headers(options.headers ?? {});
  headers.set("X-Listmonk-BFF-Key", key);
  if (!headers.has("Content-Type") && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    // Timeout 10 s — BFF sur Tailscale, latence potentielle.
    signal: AbortSignal.timeout(10_000),
  });
}

/** Sanitise un corps d'erreur BFF avant de l'inclure dans un message (anti-PII). */
function safeErrorDetail(raw: string): string {
  return raw.slice(0, 100).replace(/[^\x20-\x7E]/g, "");
}

// ── Check statut abonné (GET /subscriber) ────────────────────────────────────

/**
 * Interroge le BFF pour connaître le statut d'un email sur la liste vegourmet.
 * Utilisé avant subscribe pour détecter les emails blocklisted et les doublons
 * déjà confirmés.
 * Retourne null si l'email n'existe pas dans Listmonk.
 */
async function checkSubscriberStatus(
  email: string,
): Promise<BffSubscriberResponse> {
  const { listUuid } = bffConfig();

  // encodeURIComponent suffit ici : le BFF reçoit une query string standard,
  // pas un littéral SQL — la garde anti-guillemet simple reste dans newsletter-validation.ts.
  const res = await bffFetch(
    `/subscriber?email=${encodeURIComponent(email)}&list_uuid=${encodeURIComponent(listUuid)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    throw new Error(
      `BFF checkSubscriber HTTP ${res.status}: ${safeErrorDetail(rawBody)}`,
    );
  }

  return (await res.json()) as BffSubscriberResponse;
}

// ── Actions publiques ────────────────────────────────────────────────────────

export interface SubscribeInput {
  email: string;
  firstName?: string;
  source?: string;
  consentWording: string;
}

/**
 * Inscrit un email à la liste vegourmet (double opt-in).
 * Le BFF Listmonk crée l'abonné avec statut `unconfirmed` et déclenche
 * l'email de confirmation automatiquement.
 *
 * Idempotent : le BFF /subscribe est idempotent. On effectue un check préalable
 * via GET /subscriber pour :
 *   1. Détecter les emails blocklisted (réponse silencieuse sans révéler le statut).
 *   2. Distinguer « déjà confirmé » vs « nouvelle inscription » dans l'UI.
 */
export async function subscribeToVegourmet(
  input: SubscribeInput,
): Promise<SubscribeResult> {
  const { listUuid } = bffConfig();
  const email = input.email.trim().toLowerCase();

  // ── 1. Check préalable du statut abonné ──────────────────────────────────
  const statusCheck = await checkSubscriberStatus(email);

  if (statusCheck.exists) {
    // Email blocklisted : réponse 202 silencieuse (on ne révèle pas le statut).
    if (statusCheck.status === "blocklisted") {
      console.log(
        JSON.stringify({
          level: "info",
          action: "subscribe_blocklisted",
          timestamp: new Date().toISOString(),
        }),
      );
      return { ok: true, alreadySubscribed: false };
    }

    // Déjà confirmé ou en attente → idempotent, signaler à l'UI.
    if (
      statusCheck.list_subscription_status === "confirmed" ||
      statusCheck.list_subscription_status === "unconfirmed"
    ) {
      console.log(
        JSON.stringify({
          level: "info",
          action: "subscribe_already",
          timestamp: new Date().toISOString(),
        }),
      );
      return { ok: true, alreadySubscribed: true };
    }
  }

  // ── 2. Appel POST /subscribe ──────────────────────────────────────────────
  const body = {
    email,
    list_uuids: [listUuid],
  };

  const res = await bffFetch("/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.ok) {
    console.log(
      JSON.stringify({
        level: "info",
        action: "subscribe_requested",
        source: input.source ?? "homepage",
        timestamp: new Date().toISOString(),
      }),
    );
    return { ok: true, alreadySubscribed: false };
  }

  const rawDetail = await res.text().catch(() => "");
  console.error(
    JSON.stringify({
      level: "error",
      action: "subscribe_failed",
      http_status: res.status,
      timestamp: new Date().toISOString(),
    }),
  );
  return {
    ok: false,
    error: `Inscription refusée (HTTP ${res.status}) ${safeErrorDetail(rawDetail)}`.trim(),
  };
}

/**
 * Désabonne un email de la liste vegourmet (RFC 8058 one-click).
 * Le BFF /unsubscribe est idempotent : email introuvable → 200 sans erreur.
 */
export async function unsubscribeFromVegourmet(
  email: string,
): Promise<UnsubscribeResult> {
  const { listUuid } = bffConfig();
  const normalised = email.trim().toLowerCase();

  const res = await bffFetch("/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ email: normalised, list_uuid: listUuid }),
  });

  if (res.ok) {
    console.log(
      JSON.stringify({
        level: "info",
        action: "unsubscribe",
        timestamp: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  const rawDetail = await res.text().catch(() => "");
  console.error(
    JSON.stringify({
      level: "error",
      action: "unsubscribe_failed",
      http_status: res.status,
      timestamp: new Date().toISOString(),
    }),
  );
  return {
    ok: false,
    error: `Désabonnement refusé (HTTP ${res.status}) ${safeErrorDetail(rawDetail)}`.trim(),
  };
}
