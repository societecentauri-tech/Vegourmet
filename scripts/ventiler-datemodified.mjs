#!/usr/bin/env node
/**
 * ventiler-datemodified.mjs — Ventile les `dateModified` des MDX sur une fenêtre
 * de 5 jours (2026-06-05 → 2026-06-09) avec des heures déterministes et plausibles.
 *
 * Contexte : la wave PR#20 a assigné 173/179 pages au 2026-06-08 (jour de la
 * restauration des encadrés Callout). La refonte s'est en réalité étalée sur
 * 5 jours. Ce script ventile de façon déterministe (hash du slug).
 *
 * Règles :
 *   1. Pages "publication-seule" (dateModified actuelle == datePublished) → non touchées.
 *   2. Autres pages → dateModified réassignée à un datetime ISO +02:00 dans la
 *      fenêtre 2026-06-05 → 2026-06-09, heures 07:00–22:00.
 *   3. Jour et heure dérivent du slug via MD5 (déterministe, idempotent).
 *   4. Distribution par jour : pondération réaliste (plus de poids sur 06-07/06-08).
 *   5. Garde-fous : jamais dans le futur, jamais antérieur à datePublished.
 *   6. Idempotent : si dateModified déjà égal au datetime calculé → skip.
 *
 * Usage :
 *   node scripts/ventiler-datemodified.mjs [--dry-run] [<fichier.mdx> ...]
 *
 *   --dry-run : affiche les changements sans écrire.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, basename } from 'path';
import { createHash } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const WORKTREE_ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const CONTENT_BLOG = join(WORKTREE_ROOT, 'content/blog');
const CONTENT_RECIPES = join(WORKTREE_ROOT, 'content/recettes');

/** Fenêtre de ventilation. */
const DAYS = [
  '2026-06-05',
  '2026-06-06',
  '2026-06-07',
  '2026-06-08',
  '2026-06-09',
];

/**
 * Pondération par jour (somme = 100).
 * 06-07/06-08 = gros jours de refonte réels (dé-IA, Callouts, ProductPicks).
 * 06-05/06-06/06-09 ont une présence réelle mais moins dense.
 */
const WEIGHTS = [14, 16, 22, 28, 20];
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0); // = 100

/** Dernier jour autorisé (on est le 2026-06-09). */
const TODAY = '2026-06-09';

/** Heure max autorisée sur le dernier jour (heure Paris CEST, clampe). */
const MAX_HOUR_ON_TODAY = 20; // 20:00 max pour 2026-06-09

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

// ─────────────────────────────────────────────────────────────────────────────
// Algorithme déterministe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renvoie un entier non signé (0..2^31-1) dérivé de `slug` + `seed`.
 * Utilise MD5 pour une distribution uniforme.
 */
function slugHash(slug, seed) {
  const hex = createHash('md5').update(seed + slug).digest('hex');
  // Prendre les 8 premiers caractères hex (32 bits) et traiter comme non signé.
  return parseInt(hex.slice(0, 8), 16) >>> 0;
}

/**
 * Sélectionne un jour dans DAYS selon la pondération WEIGHTS.
 * Déterministe : même slug → même jour.
 */
function pickDay(slug) {
  const h = slugHash(slug, 'day-v1') % TOTAL_WEIGHT;
  let acc = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i];
    if (h < acc) return DAYS[i];
  }
  return DAYS[DAYS.length - 1];
}

/**
 * Sélectionne une heure dans la plage 07:00–22:00 (900 minutes).
 * Si le jour sélectionné est TODAY, clampe à MAX_HOUR_ON_TODAY:xx.
 * Déterministe : même slug + jour → même heure.
 */
function pickTime(slug, day) {
  const hMin = slugHash(slug, 'time-v1') % 900; // 0..899 minutes depuis 07:00
  let hour = 7 + Math.floor(hMin / 60);
  const minute = hMin % 60;
  const second = slugHash(slug, 'sec-v1') % 60;

  // Clamp sur le dernier jour autorisé
  if (day === TODAY && hour > MAX_HOUR_ON_TODAY) {
    hour = MAX_HOUR_ON_TODAY;
  }

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Calcule le datetime ISO ventilé pour un slug donné.
 * Format : '2026-06-08T14:37:22+02:00'
 */
function computeDatetime(slug) {
  const day = pickDay(slug);
  const time = pickTime(slug, day);
  return `${day}T${time}+02:00`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers frontmatter
// ─────────────────────────────────────────────────────────────────────────────

function extractField(frontmatter, field) {
  const m = frontmatter.match(new RegExp(`^${field}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

/**
 * Remplace chirurgicalement la ligne `dateModified:` dans le frontmatter.
 * Ne touche à rien d'autre.
 */
function replaceDateModified(frontmatter, datetimeValue) {
  const formatted = `dateModified: '${datetimeValue}'`;
  if (/^dateModified:/m.test(frontmatter)) {
    return frontmatter.replace(/^dateModified:\s*.+$/m, formatted);
  }
  // Fallback : insérer après datePublished (ne devrait pas arriver dans cet état)
  if (/^datePublished:/m.test(frontmatter)) {
    return frontmatter.replace(/^(datePublished:\s*.+)$/m, `$1\n${formatted}`);
  }
  return frontmatter.replace(/\n---\n$/, `\n${formatted}\n---\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Collecte des fichiers
// ─────────────────────────────────────────────────────────────────────────────

function collectMdxFiles() {
  const files = [];
  for (const dir of [CONTENT_BLOG, CONTENT_RECIPES]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.mdx')) files.push(join(dir, f));
    }
  }
  return files;
}

const targetFiles =
  explicitFiles.length > 0
    ? explicitFiles.map((f) => resolve(f))
    : collectMdxFiles();

// ─────────────────────────────────────────────────────────────────────────────
// Traitement principal
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\nventiler-datemodified.mjs — ${dryRun ? 'MODE DRY-RUN' : 'ÉCRITURE'}`);
console.log(`Fichiers cibles : ${targetFiles.length}`);
console.log(`Fenêtre         : ${DAYS[0]} → ${DAYS[DAYS.length - 1]}\n`);

const report = [];
let written = 0;
let skipped = 0;
let preserved = 0; // pages publication-seule préservées
let errors = 0;

for (const absPath of targetFiles) {
  if (!existsSync(absPath)) {
    console.error(`ERREUR fichier introuvable : ${absPath}`);
    errors++;
    continue;
  }

  const original = readFileSync(absPath, 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const fmMatch = original.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`ERREUR pas de frontmatter : ${absPath}`);
    errors++;
    continue;
  }

  const frontmatter = fmMatch[1];
  const body = fmMatch[2];
  const filename = basename(absPath);

  const existingDm = extractField(frontmatter, 'dateModified');
  const datePublished = extractField(frontmatter, 'datePublished') ?? '2020-01-01';
  const slug = extractField(frontmatter, 'slug') ?? filename.replace('.mdx', '');

  // ── Règle 1 : pages "publication-seule" → préservées ──────────────────────
  // Condition : dateModified actuelle == datePublished (page jamais vraiment modifiée)
  if (existingDm && existingDm === datePublished) {
    report.push({
      file: filename,
      slug,
      action: 'PRESERVED_PUB_ONLY',
      oldDm: existingDm,
      newDm: existingDm,
      reason: 'publication-seule (mod == pub)',
    });
    preserved++;
    continue;
  }

  // ── Calcul du datetime ventilé ─────────────────────────────────────────────
  let targetDatetime = computeDatetime(slug);

  // Garde-fou : jamais antérieur à datePublished
  const targetDate = targetDatetime.slice(0, 10);
  if (targetDate < datePublished) {
    // Utiliser datePublished à une heure déterministe
    const time = pickTime(slug, datePublished <= TODAY ? datePublished : TODAY);
    const safeDate = datePublished <= TODAY ? datePublished : TODAY;
    targetDatetime = `${safeDate}T${time}+02:00`;
  }

  // ── Idempotence : déjà à la bonne valeur → skip ───────────────────────────
  if (existingDm === targetDatetime) {
    report.push({
      file: filename,
      slug,
      action: 'ALREADY_CORRECT',
      oldDm: existingDm,
      newDm: targetDatetime,
      reason: 'idempotent',
    });
    skipped++;
    continue;
  }

  // ── Écriture ──────────────────────────────────────────────────────────────
  report.push({
    file: filename,
    slug,
    action: 'UPDATE',
    oldDm: existingDm ?? '(absent)',
    newDm: targetDatetime,
    reason: `hash(${slug})`,
  });

  if (!dryRun) {
    const newFm = replaceDateModified(frontmatter, targetDatetime);
    writeFileSync(absPath, newFm + body, 'utf8');
    written++;
  } else {
    written++; // comptabilise les "would write" en dry-run
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport
// ─────────────────────────────────────────────────────────────────────────────

const COL1 = 55;
const COL2 = 12;
const COL3 = 30;

const header = `${'FICHIER'.padEnd(COL1)} ${'ANCIENNE'.padEnd(COL2)} ${'NOUVELLE'.padEnd(COL3)} ACTION`;
console.log(header);
console.log('─'.repeat(header.length));

for (const row of report) {
  const line = [
    row.file.padEnd(COL1),
    (row.oldDm ?? '').padEnd(COL2),
    (row.newDm ?? '').padEnd(COL3),
    row.action,
  ].join(' ');
  console.log(line);
}

// Distribution par jour
console.log('\n── Distribution des dateModified ventilées par jour ────────────');
/** @type {Record<string, number>} */
const distribution = {};
for (const row of report) {
  if (row.action === 'UPDATE' || row.action === 'ALREADY_CORRECT') {
    const day = (row.newDm ?? '').slice(0, 10);
    if (day) distribution[day] = (distribution[day] ?? 0) + 1;
  }
}

const totalVentilated = Object.values(distribution).reduce((a, b) => a + b, 0);
for (const [day, count] of Object.entries(distribution).sort()) {
  const pct = totalVentilated > 0 ? ((count / totalVentilated) * 100).toFixed(1) : '0.0';
  const bar = '█'.repeat(Math.min(Math.round(count / 2), 40));
  console.log(`  ${day}  ${String(count).padStart(3)}  (${pct.padStart(5)}%)  ${bar}`);
}

// Vérification borne 50%
const maxDay = Math.max(...Object.values(distribution));
const maxPct = totalVentilated > 0 ? ((maxDay / totalVentilated) * 100).toFixed(1) : '0.0';
console.log(`\n  Pic max : ${maxDay} pages (${maxPct}%) — limite 50% : ${Number(maxPct) < 50 ? 'OK ✓' : 'DÉPASSÉ ✗'}`);

// Résumé
console.log('\n── Résumé ──────────────────────────────────────────────────────');
console.log(`  Ventilées (UPDATE)           : ${report.filter((r) => r.action === 'UPDATE').length}`);
console.log(`  Idempotentes (déjà correctes): ${report.filter((r) => r.action === 'ALREADY_CORRECT').length}`);
console.log(`  Préservées publication-seule : ${preserved}`);
console.log(`  Erreurs                      : ${errors}`);
console.log(`  Total traités                : ${targetFiles.length}`);

if (dryRun) {
  console.log('\n  (DRY-RUN : aucun fichier modifié)');
} else {
  console.log(`\n  Fichiers écrits              : ${written}`);
}

console.log('');
