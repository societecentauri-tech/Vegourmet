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

/**
 * Réponse d'auteur (Chloé) attachée à un avis. Jamais notée (sans étoiles).
 * L'`author_email_hash` n'est JAMAIS inclus.
 */
export interface PublicReply {
  id: string;
  authorName: string;
  content: string;
  /** ISO 8601. */
  createdAt: string;
}

/**
 * Avis de premier niveau exposé au client (l'`author_email_hash` n'est JAMAIS
 * inclus). Un avis porte une note (étoiles) et 0..n réponses imbriquées
 * (`replies`) — typiquement une seule réponse de Chloé. Les réponses ne sont
 * jamais notées et n'apparaissent qu'imbriquées sous leur avis parent.
 */
export interface PublicComment {
  id: string;
  authorName: string;
  content: string;
  /** Note 1-5, ou null pour un avis sans note (cas legacy). */
  rating: number | null;
  /** ISO 8601. */
  createdAt: string;
  /** Réponses d'auteur imbriquées (Chloé), triées du plus ancien au plus récent. */
  replies: PublicReply[];
}

/**
 * Ligne brute `public.comments` (sélection serveur, sans email hash).
 * Inclut `legacy_wp_id` / `parent_legacy_id` pour reconstruire le fil
 * (avis ↔ réponse), conformément au modèle WordPress importé.
 */
interface RawComment {
  id: string;
  legacy_wp_id: number | null;
  parent_legacy_id: number | null;
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

/**
 * Résultat paginé d'avis approuvés, **threadé**.
 * `comments` = avis de premier niveau (notés) de la page courante, chacun
 * avec ses réponses d'auteur imbriquées (`replies`). `total` compte les AVIS
 * de premier niveau de la recette (PAS le total commentaires + réponses), pour
 * que le compteur « Avis (N) » et la pagination reflètent le nombre d'avis.
 */
export interface CommentsPage {
  comments: PublicComment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Taille de page par défaut, en **avis de premier niveau** (pagination obligatoire). */
export const COMMENTS_PAGE_SIZE = 10;

/**
 * Plafond de commentaires lus par recette (avis + réponses confondus).
 * Le threading impose de récupérer l'ensemble des commentaires d'une recette
 * pour rattacher chaque réponse à son avis parent, AVANT de paginer les avis de
 * premier niveau. La volumétrie par recette est faible (quelques dizaines) ;
 * cette borne protège d'un cas pathologique (SELECT non borné interdit).
 */
const MAX_COMMENTS_PER_RECIPE = 1000;

/**
 * Liste **threadée** et paginée des avis `approved` d'une recette.
 *
 * Modèle (import WordPress) :
 *   - Avis de premier niveau : `parent_legacy_id IS NULL` (porte la note/étoiles).
 *   - Réponse d'auteur (Chloé) : `parent_legacy_id` = `legacy_wp_id` de l'avis
 *     parent, sans note.
 *
 * Algorithme :
 *   1. Récupère TOUS les commentaires `approved` de la recette (borné), triés
 *      `created_at` (ascendant pour ordonner les réponses naturellement).
 *   2. Sépare avis de premier niveau et réponses ; rattache chaque réponse à son
 *      avis parent via `parent_legacy_id === parent.legacy_wp_id`. Les réponses
 *      orphelines (parent absent/non approuvé) sont **ignorées** (jamais
 *      affichées détachées).
 *   3. Trie les avis de premier niveau du plus récent au plus ancien (comme WP).
 *   4. Pagine les avis de premier niveau (LIMIT/OFFSET en mémoire).
 *
 * N'expose JAMAIS l'email hash. Requête paramétrée (slug/status encodés).
 */
export async function fetchThreadedComments(
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

  const qs = [
    eqFilter("recipe_slug", slug),
    eqFilter("status", "approved"),
    "select=id,legacy_wp_id,parent_legacy_id,author_name,content,rating,created_at",
    // Ascendant : les réponses se concatènent dans l'ordre chronologique ;
    // les avis de premier niveau sont re-triés desc ci-dessous.
    "order=created_at.asc.nullslast",
    `limit=${MAX_COMMENTS_PER_RECIPE}`,
  ].join("&");
  const url = `${COMMENTS_API_URL}/rest/v1/comments?${qs}`;

  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
    signal: init?.signal,
  });
  if (!res.ok) {
    throw new Error(
      `comments ${res.status} ${res.statusText} pour slug=${slug}`,
    );
  }

  const rows = (await res.json()) as RawComment[];

  // 1) Indexer les réponses par legacy_wp_id du parent (chronologique).
  const repliesByParent = new Map<number, PublicReply[]>();
  for (const r of rows) {
    if (r.parent_legacy_id == null) continue; // pas une réponse
    const reply: PublicReply = {
      id: r.id,
      authorName: r.author_name ?? "Anonyme",
      content: r.content ?? "",
      createdAt: r.created_at ?? "",
    };
    const bucket = repliesByParent.get(r.parent_legacy_id);
    if (bucket) bucket.push(reply);
    else repliesByParent.set(r.parent_legacy_id, [reply]);
  }

  // 2) Construire les avis de premier niveau avec leurs réponses rattachées.
  //    Les réponses orphelines restent dans la Map et ne sont jamais affichées.
  const topLevel: PublicComment[] = [];
  for (const r of rows) {
    if (r.parent_legacy_id != null) continue; // c'est une réponse
    const replies =
      r.legacy_wp_id != null
        ? (repliesByParent.get(r.legacy_wp_id) ?? [])
        : [];
    topLevel.push({
      id: r.id,
      authorName: r.author_name ?? "Anonyme",
      content: r.content ?? "",
      rating: r.rating,
      createdAt: r.created_at ?? "",
      replies,
    });
  }

  // 3) Avis de premier niveau du plus récent au plus ancien (ordre WP).
  topLevel.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  // 4) Pagination sur les avis de premier niveau.
  const total = topLevel.length;
  const offset = (safePage - 1) * safeSize;
  const comments = topLevel.slice(offset, offset + safeSize);

  return {
    comments,
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
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
