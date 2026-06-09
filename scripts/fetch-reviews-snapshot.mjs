#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/fetch-reviews-snapshot.mjs
//
// Génère `lib/reviews-snapshot.json` : les N avis les plus récents de chaque
// recette notée, lus depuis `public.comments` (PostgREST/Kong, service_role).
//
// POURQUOI : même pattern que fetch-ratings-snapshot.mjs. Le site est SSG ;
// on fige un snapshot build-time consommé synchronement par `lib/reviews.ts`
// pour alimenter les blocs `review` du JSON-LD Recipe (schema.org).
//
// CONTRAINTES :
// - Seuls les avis avec `rating IS NOT NULL` et `status = 'approved'`
// - N = 8 avis max par recette (les plus récents)
// - Champs : author_name, content, rating, created_at
//
// TOLÉRANT À LA PANNE : si l'API est injoignable ou la clé absente,
// le script conserve le snapshot déjà commité et sort en code 0.
//
// Variables d'env (Vercel / Infisical /supabase/vegourmet-prod) :
//   COMMENTS_API_URL       (déf. https://vegourmet.alpha.cntri.cloud)
//   SUPABASE_SERVICE_KEY   (service_role, server-only ; \n parasite toléré → trim)
// ─────────────────────────────────────────────────────────────────────────────

import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "lib", "reviews-snapshot.json");

const MAX_REVIEWS_PER_RECIPE = 8;

const BASE = (
  process.env.COMMENTS_API_URL ?? "https://vegourmet.alpha.cntri.cloud"
).replace(/\/+$/, "");
const KEY = (
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  ""
).trim();

async function keepExisting(reason) {
  try {
    const current = await readFile(OUT_PATH, "utf-8");
    const parsed = JSON.parse(current);
    const n = Object.keys(parsed).length;
    console.warn(
      `[reviews-snapshot] ${reason} — snapshot existant conservé (${n} recettes).`,
    );
  } catch {
    await mkdir(path.dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, "{}\n", "utf-8");
    console.warn(
      `[reviews-snapshot] ${reason} — aucun snapshot existant, écriture d'un objet vide.`,
    );
  }
  process.exit(0);
}

async function main() {
  if (!KEY) {
    await keepExisting("SUPABASE_SERVICE_KEY absent");
    return;
  }

  // Récupère tous les avis notés et approuvés, triés par date décroissante.
  // On récupère en masse puis on tronque côté script pour éviter N requêtes.
  const url =
    `${BASE}/rest/v1/comments` +
    `?select=recipe_slug,author_name,content,rating,created_at` +
    `&rating=not.is.null` +
    `&status=eq.approved` +
    `&order=created_at.desc` +
    `&limit=5000`;

  let rows;
  try {
    const res = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      await keepExisting(`comments HTTP ${res.status}`);
      return;
    }
    rows = await res.json();
  } catch (err) {
    await keepExisting(`fetch échoué (${err?.message ?? err})`);
    return;
  }

  if (!Array.isArray(rows)) {
    await keepExisting("réponse inattendue (non-array)");
    return;
  }

  // Regroupe par slug et tronque à MAX_REVIEWS_PER_RECIPE
  /** @type {Record<string, Array<{authorName: string; content: string; rating: number; datePublished: string}>>} */
  const grouped = {};
  for (const row of rows) {
    const slug = row.recipe_slug;
    if (!slug) continue;
    if (!grouped[slug]) grouped[slug] = [];
    if (grouped[slug].length >= MAX_REVIEWS_PER_RECIPE) continue;

    grouped[slug].push({
      authorName: row.author_name ?? "Anonyme",
      content: (row.content ?? "").replace(/\r\n/g, "\n").trim(),
      rating: Number(row.rating),
      // On normalise en date ISO YYYY-MM-DD pour schema.org datePublished
      datePublished: row.created_at
        ? row.created_at.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  }

  // Filtre les recettes sans avis (garde-fou)
  const snapshot = {};
  for (const [slug, reviews] of Object.entries(grouped)) {
    if (reviews.length > 0) snapshot[slug] = reviews;
  }

  // Tri des clés pour un diff git stable
  const sorted = {};
  for (const k of Object.keys(snapshot).sort()) sorted[k] = snapshot[k];

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf-8");

  const totalReviews = Object.values(sorted).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );
  console.log(
    `[reviews-snapshot] OK — ${Object.keys(sorted).length} recettes, ${totalReviews} avis écrits dans lib/reviews-snapshot.json`,
  );
}

main().catch(async (err) => {
  await keepExisting(`erreur inattendue (${err?.message ?? err})`);
});
