// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès serveur (BFF) à la base avis/notes vegourmet.
//
// IMPORTANT — server-only :
//   Ce module utilise la clé `service_role` Supabase. Il ne DOIT JAMAIS être
//   importé par un composant client (`'use client'`) ni exposé au navigateur.
//   Toute lecture/écriture passe par les routes API Next.js (`app/api/...`),
//   conformément au standard BFF Centauri (aucun client ne parle à PostgREST).
//
// Endpoint : PostgREST derrière Kong (gotcha : header `apikey` OBLIGATOIRE en
// plus de `Authorization: Bearer`). On appelle le host direct
// `https://vegourmet.alpha.cntri.cloud` (gotcha CF Bot Fight Mode : ne pas
// passer par un `api.*` proxifié).
//
// NB : ce module n'est importé QUE par les route handlers `app/api/*` (server)
// et par le script de build du snapshot. Il n'est jamais bundlé côté client.
// On ne déclare pas `import "server-only"` (paquet non hoisté en dépendance) ;
// la garde structurelle (zéro import client) suffit. Si une régression
// introduisait un import client, le secret resterait inaccessible (process.env
// non exposé au navigateur), mais le code ne doit jamais être appelé côté client.
// ─────────────────────────────────────────────────────────────────────────────

/** Hôte PostgREST/Kong. Surchargé via COMMENTS_API_URL (Vercel/Infisical). */
export const COMMENTS_API_URL = (
  process.env.COMMENTS_API_URL ?? "https://vegourmet.alpha.cntri.cloud"
).replace(/\/+$/, "");

/**
 * Clé service_role (server-only). On nettoie un éventuel `\n` parasite en fin de
 * secret (gotcha Infisical / copie manuelle Vercel). NE JAMAIS exposer côté client.
 */
function getServiceKey(): string {
  const raw =
    process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) {
    throw new Error(
      "SUPABASE_SERVICE_KEY manquant : la couche avis/notes ne peut pas interroger la base.",
    );
  }
  return raw.trim();
}

/** Headers PostgREST/Kong (apikey + Bearer). */
function authHeaders(): Record<string, string> {
  const key = getServiceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

/** Forme normalisée d'une note agrégée (vue `recipe_ratings`). */
export interface RecipeRating {
  ratingValue: number;
  ratingCount: number;
  reviewCount: number;
}

/** Ligne brute de la vue `public.recipe_ratings`. */
interface RawRecipeRating {
  recipe_slug: string;
  rating_count: number | null;
  rating_value: number | null;
  review_count: number | null;
}

/** Commentaire exposé au client (l'`author_email_hash` n'est JAMAIS inclus). */
export interface PublicComment {
  id: string;
  authorName: string;
  content: string;
  /** Note 1-5, ou null pour une réponse d'auteur (sans note). */
  rating: number | null;
  /** ISO 8601. */
  createdAt: string;
}

/** Ligne brute `public.comments` (sélection serveur, sans email hash). */
interface RawComment {
  id: string;
  author_name: string | null;
  content: string | null;
  rating: number | null;
  created_at: string | null;
}

/** Encode une valeur pour un filtre PostgREST `col=eq.<valeur>` (pas de concat brute). */
function eqFilter(column: string, value: string): string {
  return `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`;
}

/**
 * Lit la note agrégée d'une recette via la vue `recipe_ratings`.
 * Requête paramétrée (slug encodé). Retourne `null` si la recette n'est pas notée.
 */
export async function fetchRecipeRating(
  slug: string,
  init?: { signal?: AbortSignal; cache?: RequestCache },
): Promise<RecipeRating | null> {
  const qs = `${eqFilter("recipe_slug", slug)}&select=recipe_slug,rating_count,rating_value,review_count&limit=1`;
  const url = `${COMMENTS_API_URL}/rest/v1/recipe_ratings?${qs}`;

  const res = await fetch(url, {
    headers: authHeaders(),
    cache: init?.cache ?? "no-store",
    signal: init?.signal,
  });
  if (!res.ok) {
    throw new Error(
      `recipe_ratings ${res.status} ${res.statusText} pour slug=${slug}`,
    );
  }
  const rows = (await res.json()) as RawRecipeRating[];
  const row = rows[0];
  if (!row) return null;

  const ratingCount = row.rating_count ?? 0;
  if (ratingCount <= 0) return null;

  return {
    ratingValue: row.rating_value ?? 0,
    ratingCount,
    reviewCount: row.review_count ?? 0,
  };
}

/**
 * Snapshot complet de la vue `recipe_ratings` (toutes les recettes notées).
 * Utilisé au build pour générer `lib/ratings-snapshot.json` (SSG-compatible).
 */
export async function fetchAllRecipeRatings(
  init?: { signal?: AbortSignal },
): Promise<Record<string, RecipeRating>> {
  const url = `${COMMENTS_API_URL}/rest/v1/recipe_ratings?select=recipe_slug,rating_count,rating_value,review_count&limit=2000`;
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
    signal: init?.signal,
  });
  if (!res.ok) {
    throw new Error(`recipe_ratings (all) ${res.status} ${res.statusText}`);
  }
  const rows = (await res.json()) as RawRecipeRating[];
  const out: Record<string, RecipeRating> = {};
  for (const row of rows) {
    const ratingCount = row.rating_count ?? 0;
    if (ratingCount <= 0) continue;
    out[row.recipe_slug] = {
      ratingValue: row.rating_value ?? 0,
      ratingCount,
      reviewCount: row.review_count ?? 0,
    };
  }
  return out;
}

/** Résultat paginé de commentaires approuvés. */
export interface CommentsPage {
  comments: PublicComment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Taille de page par défaut (pagination obligatoire). */
export const COMMENTS_PAGE_SIZE = 10;

/**
 * Liste paginée des commentaires `approved` d'une recette, triés `created_at` desc.
 * Pagination via `LIMIT/OFFSET` (Range PostgREST). N'expose JAMAIS l'email hash.
 */
export async function fetchApprovedComments(
  slug: string,
  page: number,
  pageSize: number = COMMENTS_PAGE_SIZE,
  init?: { signal?: AbortSignal },
): Promise<CommentsPage> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeSize =
    Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 50
      ? Math.floor(pageSize)
      : COMMENTS_PAGE_SIZE;
  const offset = (safePage - 1) * safeSize;
  const rangeFrom = offset;
  const rangeTo = offset + safeSize - 1;

  const qs = [
    eqFilter("recipe_slug", slug),
    eqFilter("status", "approved"),
    "select=id,author_name,content,rating,created_at",
    "order=created_at.desc.nullslast",
  ].join("&");
  const url = `${COMMENTS_API_URL}/rest/v1/comments?${qs}`;

  const res = await fetch(url, {
    headers: {
      ...authHeaders(),
      // Range + count exact → total via header content-range, offset/limit propre.
      Range: `${rangeFrom}-${rangeTo}`,
      "Range-Unit": "items",
      Prefer: "count=exact",
    },
    cache: "no-store",
    signal: init?.signal,
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(
      `comments ${res.status} ${res.statusText} pour slug=${slug}`,
    );
  }

  const rows = (await res.json()) as RawComment[];
  const total = parseContentRangeTotal(res.headers.get("content-range"));
  const comments: PublicComment[] = rows.map((r) => ({
    id: r.id,
    authorName: r.author_name ?? "Anonyme",
    content: r.content ?? "",
    rating: r.rating,
    createdAt: r.created_at ?? "",
  }));

  return {
    comments,
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

/** Extrait le total d'un header `content-range: 0-9/42` (→ 42). */
function parseContentRangeTotal(header: string | null): number {
  if (!header) return 0;
  const slash = header.split("/")[1];
  if (!slash || slash === "*") return 0;
  const n = Number.parseInt(slash, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Données validées d'un nouvel avis (issues de la route POST). */
export interface NewCommentInput {
  slug: string;
  authorName: string;
  content: string;
  rating: number;
}

/**
 * Insère un nouvel avis en `status='pending'` (modération), `legacy_wp_id` NULL.
 * `created_at` posé côté serveur (now()) pour un tri cohérent une fois approuvé.
 * Retourne l'id créé. La validation/sanitization est faite en amont (route POST).
 */
export async function insertPendingComment(
  input: NewCommentInput,
  init?: { signal?: AbortSignal },
): Promise<{ id: string }> {
  const url = `${COMMENTS_API_URL}/rest/v1/comments`;
  const body = {
    recipe_slug: input.slug,
    author_name: input.authorName,
    content: input.content,
    rating: input.rating,
    status: "pending",
    legacy_wp_id: null,
    created_at: new Date().toISOString(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: init?.signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`insert comment ${res.status} ${res.statusText} ${detail}`);
  }
  const rows = (await res.json()) as { id: string }[];
  const id = rows[0]?.id;
  if (!id) throw new Error("insert comment : aucune ligne retournée");
  return { id };
}
