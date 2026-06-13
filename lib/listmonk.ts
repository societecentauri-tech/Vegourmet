// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès serveur (BFF) vers l'API Listmonk.
//
// server-only : utilise LISTMONK_API_TOKEN (Infisical /_infra/listmonk).
// Jamais importé côté client. Tout trafic passe par les routes API Next.js
// (standard BFF Centauri bff-2026.md).
//
// Listmonk v6.1.0 — HTTP Basic auth (username:password) via Authorization header.
// L'API est exposée via Tailscale uniquement ; les routes Vercel appellent
// LISTMONK_API_URL (ex. https://listmonk.alpha.cntri.cloud) via Tailscale.
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";

/** Vérifications de configuration au démarrage (pas au build). */
function listmonkConfig(): { baseUrl: string; auth: string } {
  const url = process.env.LISTMONK_API_URL;
  const user = process.env.LISTMONK_API_USER;
  const token = process.env.LISTMONK_API_TOKEN;

  if (!url || !user || !token) {
    throw new Error(
      "Config Listmonk incomplète : LISTMONK_API_URL, LISTMONK_API_USER et LISTMONK_API_TOKEN sont requis.",
    );
  }

  const encoded = Buffer.from(`${user}:${token}`).toString("base64");
  return { baseUrl: url.replace(/\/$/, ""), auth: `Basic ${encoded}` };
}

/** Numéro de liste vegourmet dans Listmonk (à provisionner dans Vercel/Infisical). */
function vegourmetListId(): number {
  const raw = process.env.LISTMONK_LIST_ID_VEGOURMET;
  const id = raw ? parseInt(raw, 10) : NaN;
  if (!raw || isNaN(id) || id <= 0) {
    throw new Error(
      "LISTMONK_LIST_ID_VEGOURMET manquant ou invalide (entier > 0 requis).",
    );
  }
  return id;
}

// ── Types API Listmonk ───────────────────────────────────────────────────────

interface ListmonkSubscriber {
  id: number;
  uuid: string;
  email: string;
  name: string;
  status: "enabled" | "disabled" | "blocklisted";
  lists?: Array<{ id: number; subscription_status: string }>;
  attribs?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ListmonkApiResponse<T> {
  data: T;
}

// ── Résultats ────────────────────────────────────────────────────────────────

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

export type UnsubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function listmonkFetch(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const { baseUrl, auth } = listmonkConfig();
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", auth);
  if (!headers.has("Content-Type") && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    // Timeout 10 s (Listmonk est derrière Tailscale, latence potentielle).
    signal: AbortSignal.timeout(10_000),
  });
}

/** Récupère un abonné par email. Retourne null si introuvable. */
async function getSubscriberByEmail(
  email: string,
): Promise<ListmonkSubscriber | null> {
  // Échappement du guillemet simple pour le littéral SQL Listmonk (ex. o'neil → o''neil).
  const safeEmail = email.replace(/'/g, "''");
  const res = await listmonkFetch(
    `/api/subscribers?query=email+%3D+%27${encodeURIComponent(safeEmail)}%27&per_page=1`,
    { method: "GET" },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Listmonk getSubscriber HTTP ${res.status}: ${body}`);
  }
  const json = (await res.json()) as { data: { results: ListmonkSubscriber[] } };
  return json.data.results[0] ?? null;
}

// ── Actions publiques ────────────────────────────────────────────────────────

export interface SubscribeInput {
  email: string;
  firstName?: string;
  source?: string;
  consentWording: string;
}

/**
 * Inscrit un email à la liste vegourmet avec statut `unconfirmed`.
 * Listmonk envoie l'email de double opt-in via le template id 5 (veg-double-optin).
 * Idempotent : si l'abonné est déjà `unconfirmed` ou `confirmed`, retourne
 * `alreadySubscribed: true` sans créer de doublon.
 */
export async function subscribeToVegourmet(
  input: SubscribeInput,
): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase();
  const listId = vegourmetListId();

  // Vérification suppression-list : si l'email est `blocklisted`, on refuse
  // silencieusement (202 côté client — on ne révèle pas le statut).
  const existing = await getSubscriberByEmail(email);
  if (existing?.status === "blocklisted") {
    // On log sans PII : pas de l'email en clair.
    console.log(
      JSON.stringify({
        level: "info",
        action: "subscribe_blocklisted",
        timestamp: new Date().toISOString(),
      }),
    );
    // Retourne un succès apparent (ne pas révéler la suppression-list à l'appelant).
    return { ok: true, alreadySubscribed: false };
  }

  // Si déjà inscrit et non blocklisted → idempotent.
  if (existing) {
    const myList = existing.lists?.find((l) => l.id === listId);
    if (
      myList?.subscription_status === "confirmed" ||
      myList?.subscription_status === "unconfirmed"
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

  // Création ou mise à jour de l'abonné avec statut `unconfirmed` (double opt-in).
  const body = {
    email,
    name: input.firstName?.trim() || email.split("@")[0],
    status: "enabled",
    lists: [listId],
    preconfirm_subscriptions: false, // déclenche l'email double opt-in
    attribs: {
      source: input.source ?? "homepage",
      consent_wording: input.consentWording,
      consent_at: new Date().toISOString(),
    },
  };

  const res = await listmonkFetch("/api/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.status === 200 || res.status === 201) {
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

  // 409 : email déjà présent dans Listmonk (race condition ou autre liste).
  if (res.status === 409) {
    return { ok: true, alreadySubscribed: true };
  }

  const rawDetail = await res.text().catch(() => "");
  // Sanitisation : tronque à 100 car. et retire les caractères non-ASCII pour éviter
  // qu'un corps d'erreur Listmonk (qui peut refléter l'email) ne se retrouve en log.
  const safeDetail = rawDetail.slice(0, 100).replace(/[^\x20-\x7E]/g, "");
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
    error: `Inscription refusée (HTTP ${res.status}) ${safeDetail}`.trim(),
  };
}

/**
 * Désabonne un email de la liste vegourmet via l'API Listmonk.
 * Appelé par la route `POST /api/newsletter/unsubscribe` (RFC 8058 one-click).
 * Si l'email est introuvable, retourne ok:true (idempotent).
 */
export async function unsubscribeFromVegourmet(
  email: string,
): Promise<UnsubscribeResult> {
  const normalised = email.trim().toLowerCase();
  const listId = vegourmetListId();

  const subscriber = await getSubscriberByEmail(normalised);
  if (!subscriber) {
    // Pas d'abonné trouvé → idempotent.
    return { ok: true };
  }

  // Mettre la souscription à `unsubscribed` sur la liste vegourmet.
  const res = await listmonkFetch(
    `/api/subscribers/${subscriber.id}/lists`,
    {
      method: "PUT",
      body: JSON.stringify({
        ids: [listId],
        action: "unsubscribe",
        status: "unsubscribed",
      }),
    },
  );

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
  const safeDetail = rawDetail.slice(0, 100).replace(/[^\x20-\x7E]/g, "");
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
    error: `Désabonnement refusé (HTTP ${res.status}) ${safeDetail}`.trim(),
  };
}
