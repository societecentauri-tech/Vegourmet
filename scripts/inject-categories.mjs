#!/usr/bin/env node
/**
 * inject-categories.mjs — Corrige le champ `category` dans les 44 MDX blog.
 *
 * Problème : les 44 articles blog ont `category` = slug brut minuscule sans
 * accent (ex : "actualites et tendances") au lieu du label propre accentué.
 * Les 134 recettes ne sont PAS concernées (leur category est déjà propre).
 *
 * Source authoritative : categories.json WP (slug → label décodé HTML).
 * Décision Arthur : « & tendances » (esperluette, source categories.json + nav.ts).
 *
 * Mapping slug → label propre :
 *   actualites-et-tendances   → "Actualités & tendances"
 *   conseils-et-astuces       → "Conseils et astuces"
 *   guides-pratiques          → "Guides pratiques"
 *   inspiration-et-lifestyle  → "Inspiration & Lifestyle"
 *   non-classe                → "Non classé"
 *
 * Clé de jointure : `categorySlug` du frontmatter (fiable selon audit Bohort).
 *
 * Idempotent : si `category` est déjà le label propre → skip.
 *
 * Usage :
 *   node scripts/inject-categories.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const CONTENT_BLOG = resolve("content/blog");

// Mapping slug → label propre (source : categories.json + nav.ts, décision Arthur)
const CATEGORY_MAP = {
  "actualites-et-tendances":  "Actualités & tendances",
  "conseils-et-astuces":      "Conseils et astuces",
  "guides-pratiques":         "Guides pratiques",
  "inspiration-et-lifestyle": "Inspiration & Lifestyle",
  "non-classe":               "Non classé",
};

// ─────────────────────────────────────────────────────────────────────────────

function extractField(frontmatter, field) {
  const m = frontmatter.match(new RegExp(`^${field}:\\s*['"]?([^'\"\\n]+)['"]?\\s*$`, "m"));
  return m ? m[1].trim() : null;
}

/** Remplace la valeur de `category:` en gardant les guillemets si présents. */
function replaceCategory(frontmatter, newLabel) {
  // Cas guillemets simples : category: 'valeur'
  if (/^category:\s*'.+'$/m.test(frontmatter)) {
    return frontmatter.replace(/^(category:\s*')[^']*(')$/m, `$1${newLabel}$2`);
  }
  // Cas guillemets doubles : category: "valeur"
  if (/^category:\s*".+"$/m.test(frontmatter)) {
    return frontmatter.replace(/^(category:\s*")[^"]*(" *)$/m, `$1${newLabel}$2`);
  }
  // Cas sans guillemets : category: valeur
  return frontmatter.replace(/^(category:\s*).+$/m, `$1${newLabel}`);
}

// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n🌱 inject-categories.mjs — ${dryRun ? "MODE DRY-RUN" : "ÉCRITURE"}`);
console.log(`   Répertoire : ${CONTENT_BLOG}\n`);

let injected = 0;
let alreadyCorrect = 0;
let noSlug = 0;
let noMapping = 0;
let errors = 0;

const files = readdirSync(CONTENT_BLOG)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => join(CONTENT_BLOG, f));

for (const absPath of files) {
  const original = readFileSync(absPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const fmMatch = original.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) { errors++; continue; }

  const frontmatter = fmMatch[1];
  const body = fmMatch[2];

  const slug = absPath.split("/").pop().replace(/\.mdx$/, "");
  const categorySlug = extractField(frontmatter, "categorySlug");
  const currentCategory = extractField(frontmatter, "category");

  if (!categorySlug) {
    console.warn(`  ⚠️  Pas de categorySlug : ${slug}`);
    noSlug++;
    continue;
  }

  const correctLabel = CATEGORY_MAP[categorySlug];
  if (!correctLabel) {
    console.warn(`  ⚠️  categorySlug inconnu "${categorySlug}" : ${slug}`);
    noMapping++;
    continue;
  }

  if (currentCategory === correctLabel) {
    alreadyCorrect++;
    continue;
  }

  injected++;
  console.log(`  ✏️  ${slug}`);
  console.log(`      "${currentCategory}" → "${correctLabel}"`);

  if (!dryRun) {
    const newFm = replaceCategory(frontmatter, correctLabel);
    writeFileSync(absPath, newFm + body, "utf8");
  }
}

console.log("\n── Résumé ──────────────────────────────────────");
console.log(`  ✅ Corrigés         : ${injected}`);
console.log(`  ✅ Déjà corrects    : ${alreadyCorrect}`);
console.log(`  ⚠️  Sans categorySlug: ${noSlug}`);
console.log(`  ⚠️  Slug non mappé  : ${noMapping}`);
console.log(`  ❌ Erreurs          : ${errors}`);
console.log(`  Total blog MDX      : ${files.length}`);
if (dryRun) console.log("\n  (DRY-RUN : aucun fichier modifié)\n");
else console.log(`\n  💾 ${injected} fichier(s) écrits\n`);
