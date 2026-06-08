#!/usr/bin/env node
/**
 * inject-datemodified.mjs — Injecte `dateModified` dans le frontmatter des 178 MDX.
 *
 * Source authoritative : exports WP (posts.json, recipes.json, pages.json).
 * Clé de jointure : `slug` MDX == `slug` WP (audit Bohort W2.0 : 178/178 matchés).
 * Format : YYYY-MM-DD (tronqué à 10 car depuis `modified` local WP, cohérent avec datePublished).
 *
 * Comportement :
 *   - Idempotent : si `dateModified` est déjà présent et CORRECT → skip.
 *   - Si `dateModified` présent mais valeur différente → log comme "divergent" et écrase.
 *   - Cas limite : 14 fichiers où modified == date → injecte quand même (uniformité).
 *   - Place `dateModified` juste APRÈS `datePublished` dans le frontmatter YAML.
 *
 * Usage :
 *   node scripts/inject-datemodified.mjs [--dry-run] [<fichier.mdx> ...]
 *
 *   Sans fichiers : traite tous les 178 MDX (mode global).
 *   Avec fichiers  : traite seulement les fichiers listés.
 *   --dry-run      : log sans écrire.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicitFiles = args.filter((a) => !a.startsWith("--"));

const CONTENT_BLOG = resolve("content/blog");
const CONTENT_RECIPES = resolve("content/recettes");
const WP_DIR = "/home/greg/backups/vegourmet/2026-06-03/content";

// ─────────────────────────────────────────────────────────────────────────────
// Chargement des exports WP
// ─────────────────────────────────────────────────────────────────────────────

function loadWpIndex() {
  const posts = JSON.parse(readFileSync(join(WP_DIR, "posts.json"), "utf8"));
  const recipes = JSON.parse(readFileSync(join(WP_DIR, "recipes.json"), "utf8"));
  const pages = JSON.parse(readFileSync(join(WP_DIR, "pages.json"), "utf8"));

  /** @type {Map<string, string>} slug → dateModified (YYYY-MM-DD) */
  const index = new Map();
  for (const entry of [...posts, ...recipes, ...pages]) {
    if (entry.slug && entry.modified) {
      index.set(entry.slug, entry.modified.slice(0, 10));
    }
  }
  return index;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Extrait le slug depuis le frontmatter YAML (ligne `slug: '...'` ou `slug: ...`). */
function extractSlug(frontmatter) {
  const m = frontmatter.match(/^slug:\s*['"]?([^'"\n]+)['"]?\s*$/m);
  return m ? m[1].trim() : null;
}

/** Extrait la valeur d'un champ frontmatter scalaire. */
function extractField(frontmatter, field) {
  const m = frontmatter.match(new RegExp(`^${field}:\\s*['"]?([^'\"\\n]+)['"]?\\s*$`, "m"));
  return m ? m[1].trim() : null;
}

/**
 * Insère ou remplace `dateModified: 'YYYY-MM-DD'` dans le frontmatter.
 * Place le champ APRÈS la ligne `datePublished:` pour cohérence visuelle.
 * Si `datePublished:` absent → insère avant la dernière ligne `---`.
 */
function injectDateModified(frontmatter, dateValue) {
  const formatted = `dateModified: '${dateValue}'`;

  // Cas 1 : déjà présent → remplacer la valeur
  if (/^dateModified:/m.test(frontmatter)) {
    return frontmatter.replace(/^dateModified:\s*.+$/m, formatted);
  }

  // Cas 2 : insérer après datePublished
  if (/^datePublished:/m.test(frontmatter)) {
    return frontmatter.replace(
      /^(datePublished:\s*.+)$/m,
      `$1\n${formatted}`
    );
  }

  // Cas 3 : fallback — insérer avant la ligne de clôture `---`
  return frontmatter.replace(/\n---\n$/, `\n${formatted}\n---\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Collecter les fichiers à traiter
// ─────────────────────────────────────────────────────────────────────────────

function collectMdxFiles() {
  const files = [];
  for (const dir of [CONTENT_BLOG, CONTENT_RECIPES]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".mdx")) files.push(join(dir, f));
    }
  }
  return files;
}

const targetFiles = explicitFiles.length > 0
  ? explicitFiles.map((f) => resolve(f))
  : collectMdxFiles();

// ─────────────────────────────────────────────────────────────────────────────
// Traitement
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n🌱 inject-datemodified.mjs — ${dryRun ? "MODE DRY-RUN" : "ÉCRITURE"}`);
console.log(`   Fichiers cibles : ${targetFiles.length}`);
console.log(`   Source WP       : ${WP_DIR}`);

const wpIndex = loadWpIndex();
console.log(`   Index WP chargé : ${wpIndex.size} entrées (posts + recipes + pages)\n`);

let injected = 0;
let alreadyCorrect = 0;
let divergent = 0;
let noWpMatch = 0;
let errors = 0;

for (const absPath of targetFiles) {
  if (!existsSync(absPath)) {
    console.error(`❌ Fichier introuvable : ${absPath}`);
    errors++;
    continue;
  }

  const original = readFileSync(absPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const fmMatch = original.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`❌ Pas de frontmatter : ${absPath}`);
    errors++;
    continue;
  }
  const frontmatter = fmMatch[1];
  const body = fmMatch[2];

  const slug = extractSlug(frontmatter);
  if (!slug) {
    console.error(`❌ Slug introuvable dans : ${absPath}`);
    errors++;
    continue;
  }

  const wpDate = wpIndex.get(slug);
  if (!wpDate) {
    console.warn(`⚠️  Aucune entrée WP pour slug="${slug}" (${absPath.split("/").pop()})`);
    noWpMatch++;
    continue;
  }

  const existingDm = extractField(frontmatter, "dateModified");
  const datePublished = extractField(frontmatter, "datePublished");

  if (existingDm === wpDate) {
    // Déjà correct, idempotent
    alreadyCorrect++;
    continue;
  }

  if (existingDm && existingDm !== wpDate) {
    divergent++;
    console.log(`  ⚡ DIVERGENT  ${slug}`);
    console.log(`     actuel=${existingDm}  →  WP=${wpDate}`);
  } else {
    injected++;
    if (dryRun) {
      const equal = (wpDate === datePublished);
      console.log(`  + INJECT  ${slug}  dateModified=${wpDate}${equal ? "  [==datePublished]" : "  [diff de datePublished]"}`);
    }
  }

  const newFm = injectDateModified(frontmatter, wpDate);
  const newContent = newFm + body;

  if (!dryRun) {
    writeFileSync(absPath, newContent, "utf8");
  }
}

console.log("\n── Résumé ──────────────────────────────────────");
console.log(`  ✅ Injectés (nouveaux)   : ${injected}`);
console.log(`  ✅ Déjà corrects (skip)  : ${alreadyCorrect}`);
console.log(`  ⚡ Divergents (écrasés)  : ${divergent}`);
console.log(`  ⚠️  Sans match WP         : ${noWpMatch}`);
console.log(`  ❌ Erreurs               : ${errors}`);
console.log(`  Total traités            : ${targetFiles.length}`);
if (dryRun) console.log("\n  (DRY-RUN : aucun fichier modifié)\n");
else console.log(`\n  💾 ${injected + divergent} fichier(s) écrits\n`);
