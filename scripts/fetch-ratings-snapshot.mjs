#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/fetch-ratings-snapshot.mjs
//
// Génère `lib/ratings-snapshot.json` : note agrégée de chaque recette notée,
// lue depuis la vue `public.recipe_ratings` (PostgREST/Kong, service_role).
//
// POURQUOI : le site est SSG (App Router, `generateStaticParams`). On ne peut
// pas faire un fetch réseau par page au build de façon fiable (build offline,
// API momentanément injoignable). On fige donc un SNAPSHOT au build, consommé
// SYNCHRONEMENT par `lib/ratings.ts`. Ce JSON alimente :
//   - `aggregateRating` dans le JSON-LD Recipe (UNIQUEMENT recettes notées),
//   - la vraie note affichée sur la carte recette (étoiles + nb d'avis).
//
// TOLÉRANT À LA PANNE : si l'API est injoignable ou la clé absente, le script
// NE CASSE PAS le build — il conserve le snapshot déjà commité (fallback) et
// sort en code 0 avec un avertissement. Lancé via `prebuild` (npm).
//
// Variables d'env (Vercel / Infisical /supabase/vegourmet-prod) :
//   COMMENTS_API_URL       (déf. https://vegourmet.alpha.cntri.cloud)
//   SUPABASE_SERVICE_KEY   (service_role, server-only ; \n parasite toléré → trim)
// ─────────────────────────────────────────────────────────────────────────────

import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "lib", "ratings-snapshot.json");

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
      `[ratings-snapshot] ${reason} — snapshot existant conservé (${n} recettes).`,
    );
  } catch {
    // Pas de snapshot existant : on écrit un objet vide pour ne pas casser l'import.
    await mkdir(path.dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, "{}\n", "utf-8");
    console.warn(
      `[ratings-snapshot] ${reason} — aucun snapshot existant, écriture d'un objet vide.`,
    );
  }
  process.exit(0);
}

async function main() {
  if (!KEY) {
    await keepExisting("SUPABASE_SERVICE_KEY absent");
    return;
  }

  const url = `${BASE}/rest/v1/recipe_ratings?select=recipe_slug,rating_count,rating_value,review_count&limit=2000`;
  let rows;
  try {
    const res = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      // Build : pas de cache, on veut la valeur du moment.
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      await keepExisting(`recipe_ratings HTTP ${res.status}`);
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

  const snapshot = {};
  for (const row of rows) {
    const count = Number(row.rating_count) || 0;
    if (count <= 0) continue; // jamais d'aggregateRating sur une recette 0-note
    snapshot[row.recipe_slug] = {
      ratingValue: Number(row.rating_value) || 0,
      ratingCount: count,
      reviewCount: Number(row.review_count) || 0,
    };
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  // Tri des clés pour un diff git stable.
  const sorted = {};
  for (const k of Object.keys(snapshot).sort()) sorted[k] = snapshot[k];
  await writeFile(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf-8");
  console.log(
    `[ratings-snapshot] OK — ${Object.keys(sorted).length} recettes notées écrites dans lib/ratings-snapshot.json`,
  );
}

main().catch(async (err) => {
  await keepExisting(`erreur inattendue (${err?.message ?? err})`);
});
