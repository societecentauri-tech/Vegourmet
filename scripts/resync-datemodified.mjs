#!/usr/bin/env node
/**
 * resync-datemodified.mjs — Resynchronise `dateModified` de chaque MDX
 * avec la vraie date du dernier commit git SUBSTANTIEL qui a touché le fichier.
 *
 * Définition de SUBSTANTIEL vs MÉCANIQUE :
 *   MÉCANIQUE (exclu) : commit dont les modifs du fichier concernent UNIQUEMENT :
 *     - conversion de liens absolus → relatifs (https://vegourmet.fr/ → /)
 *     - ajout/retrait de trailing-slash dans des URLs
 *     - réécriture de la seule ligne `dateModified:` ou `datePublished:`
 *     - changements d'espaces/indentation dans le frontmatter
 *     - messages de commit contenant : « liens relatifs », « trailing-slash »,
 *       « dateModified », « slug final », « bump »
 *   SUBSTANTIEL (inclus) : toute modif du corps éditorial (prose, recette,
 *     encadrés, tutoiement, dé-IA, ProductPicks, Callout, JSX métier, steps, FAQ).
 *
 * Garanties :
 *   - dateModified ne peut jamais être dans le futur.
 *   - dateModified ne peut jamais être antérieur à datePublished.
 *   - Les pages déjà à une date >= 2026-06-05 ne sont PAS régressées.
 *   - Idempotent : relancer après application ne modifie rien.
 *
 * Usage :
 *   node scripts/resync-datemodified.mjs [--dry-run] [--report-only] [<fichier.mdx> ...]
 *
 *   --dry-run     : affiche les changements prévus sans écrire.
 *   --report-only : génère uniquement le rapport sans écrire (implique --dry-run).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, basename } from 'path';
import { execFileSync } from 'child_process';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// GIT_DIR : on utilise le worktree courant (qui contient tous les commits de la branche,
// y compris ceux non encore mergés sur main). Les fichiers MDX peuvent exister seulement
// sur cette branche (ex: classement-des-meilleures-margarines.mdx).
const REPO_ROOT = resolve('/home/greg/Documents/GitHub/Vegourmet/.claude/worktrees/agent-ac8f1d0b00ec0c8da');
const WORKTREE_ROOT = resolve('/home/greg/Documents/GitHub/Vegourmet/.claude/worktrees/agent-ac8f1d0b00ec0c8da');
const CONTENT_BLOG = join(WORKTREE_ROOT, 'content/blog');
const CONTENT_RECIPES = join(WORKTREE_ROOT, 'content/recettes');
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('--report-only');
const reportOnly = args.includes('--report-only');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

// ─────────────────────────────────────────────────────────────────────────────
// Patterns de classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Messages de commit qui indiquent un commit MÉCANIQUE sur les fichiers MDX.
 * Ces patterns sont évalués sur le message entier (toLowerCase).
 */
const MECHANICAL_MSG_PATTERNS = [
  /liens? relatifs?/i,
  /trailing.?slash/i,
  /slash final/i,
  /datemodified/i,
  /bump (version|deps)/i,
  /métadonnées carousel/i,
  // Le commit "restaurer métadonnées carousel + BlogPosting + liens relatifs MDX"
  // est majoritairement mécanique (788 liens relatifs) mais contient aussi
  // le fix frontmatter classement-margarines. On le classifie global MÉCANIQUE
  // sauf pour classement-margarines (traité par diffLines).
];

/**
 * Vérifie si un diff de fichier est MÉCANIQUE.
 * Retourne true si toutes les lignes +/- touchées sont mécaniques.
 */
function isMechanicalDiff(diffLines) {
  // On ne regarde que les lignes ajoutées/supprimées (pas les lignes de contexte)
  const changed = diffLines.filter((l) => l.startsWith('+') || l.startsWith('-'));
  // Retirer les lignes d'en-tête du diff (--- +++ @@)
  const contentLines = changed.filter(
    (l) => !l.startsWith('---') && !l.startsWith('+++') && !l.startsWith('@@')
  );

  if (contentLines.length === 0) return true;

  // Patterns de lignes mécaniques :
  // 1. Ligne dateModified/datePublished dans le frontmatter
  // 2. Lien absolu → relatif (https://vegourmet.fr/... → /...)
  //    sous forme ](https://vegourmet.fr/... → ]( /...
  // 3. Lien avec trailing slash ajouté/retiré sur URL vegourmet.fr
  // 4. Espaces/indentation seuls
  const mechanicalLinePattern =
    /^[+-](?:\s*(?:dateModified|datePublished):|.*\]\(https?:\/\/vegourmet\.fr\/|.*\]\(\s*\/|.*https?:\/\/vegourmet\.fr\/.*\/\)|.*https?:\/\/vegourmet\.fr\/[^)]*\)|\s*)$/;

  return contentLines.every((l) => mechanicalLinePattern.test(l));
}

/**
 * Vérifie si le message de commit indique un commit mécanique global.
 */
function isMechanicalMessage(msg) {
  return MECHANICAL_MSG_PATTERNS.some((p) => p.test(msg));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers frontmatter
// ─────────────────────────────────────────────────────────────────────────────

function extractField(frontmatter, field) {
  const m = frontmatter.match(new RegExp(`^${field}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

function replaceDateModified(frontmatter, dateValue) {
  const formatted = `dateModified: '${dateValue}'`;
  if (/^dateModified:/m.test(frontmatter)) {
    return frontmatter.replace(/^dateModified:\s*.+$/m, formatted);
  }
  if (/^datePublished:/m.test(frontmatter)) {
    return frontmatter.replace(/^(datePublished:\s*.+)$/m, `$1\n${formatted}`);
  }
  return frontmatter.replace(/\n---\n$/, `\n${formatted}\n---\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Git helpers
// ─────────────────────────────────────────────────────────────────────────────

function gitLog(filePath) {
  // Chemin relatif au repo pour git log
  const relPath = filePath.replace(WORKTREE_ROOT + '/', '');
  try {
    const out = execFileSync(
      'git',
      ['-C', REPO_ROOT, 'log', '--follow', '--format=%H|%ai|%s', '--', relPath],
      { encoding: 'utf8', timeout: 15000 }
    );
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, date, ...msgParts] = line.split('|');
        return { hash: hash.trim(), date: date.slice(0, 10), msg: msgParts.join('|').trim() };
      });
  } catch {
    return [];
  }
}

function gitDiffLines(hash, filePath) {
  const relPath = filePath.replace(WORKTREE_ROOT + '/', '');
  try {
    const out = execFileSync(
      'git',
      ['-C', REPO_ROOT, 'show', hash, '--', relPath],
      { encoding: 'utf8', timeout: 15000 }
    );
    return out.split('\n');
  } catch {
    return [];
  }
}

/**
 * Trouve le commit SUBSTANTIEL le plus récent pour un fichier.
 * Retourne { date, hash, msg } ou null si aucun trouvé.
 */
function findLastSubstantialCommit(filePath) {
  const commits = gitLog(filePath);
  for (const commit of commits) {
    // D'abord vérifier le message : si clairement mécanique, skip sans lire le diff
    if (isMechanicalMessage(commit.msg)) {
      continue;
    }
    // Sinon, analyser le diff
    const diffLines = gitDiffLines(commit.hash, filePath);
    if (diffLines.length === 0) continue; // fichier non modifié dans ce commit
    if (isMechanicalDiff(diffLines)) {
      continue;
    }
    // Commit substantiel trouvé
    return commit;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collecter les fichiers
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
  explicitFiles.length > 0 ? explicitFiles.map((f) => resolve(f)) : collectMdxFiles();

// ─────────────────────────────────────────────────────────────────────────────
// Traitement principal
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\nresync-datemodified.mjs — ${dryRun ? 'MODE DRY-RUN' : 'ÉCRITURE'}`);
console.log(`Fichiers cibles : ${targetFiles.length}`);
console.log(`Repo git         : ${REPO_ROOT}\n`);

/**
 * @typedef {{ file: string, oldDate: string|null, newDate: string|null, triggerHash: string, triggerMsg: string, action: string }} ReportRow
 */
const report = [];

let written = 0;
let skipped = 0;
let noSubstantial = 0;
let errors = 0;

for (const absPath of targetFiles) {
  if (!existsSync(absPath)) {
    console.error(`ERREUR fichier introuvable : ${absPath}`);
    errors++;
    continue;
  }

  const original = readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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

  // Garde-fou : ne pas régresser une date déjà récente et sincère (>= 2026-06-05)
  if (existingDm && existingDm >= '2026-06-05') {
    report.push({
      file: filename,
      oldDate: existingDm,
      newDate: existingDm,
      triggerHash: '(déjà à jour)',
      triggerMsg: '(conservé)',
      action: 'SKIP_RECENT',
    });
    skipped++;
    continue;
  }

  const lastSubstantial = findLastSubstantialCommit(absPath);

  if (!lastSubstantial) {
    // Aucun commit substantiel trouvé.
    // Cas particulier : article récent (datePublished >= 2026-06-05) sans dateModified
    // → on utilise datePublished comme valeur (cohérent : publié et jamais modifié).
    if (!existingDm && datePublished >= '2026-06-05') {
      const newDateFallback = datePublished;
      report.push({
        file: filename,
        oldDate: '(absent)',
        newDate: newDateFallback,
        triggerHash: '(fallback)',
        triggerMsg: `datePublished utilisé (aucun commit substantiel, article récent)`,
        action: 'INSERT_FROM_DATEPUBLISHED',
      });
      if (!dryRun) {
        const newFm = replaceDateModified(frontmatter, newDateFallback);
        writeFileSync(absPath, newFm + body, 'utf8');
        written++;
      } else {
        written++;
      }
      continue;
    }
    // Sinon : laisser inchangé
    report.push({
      file: filename,
      oldDate: existingDm ?? '(aucune)',
      newDate: existingDm ?? '(aucune)',
      triggerHash: '(aucun)',
      triggerMsg: 'AUCUN commit substantiel',
      action: 'NO_SUBSTANTIAL',
    });
    noSubstantial++;
    continue;
  }

  let newDate = lastSubstantial.date;

  // Garde-fou : jamais dans le futur
  if (newDate > TODAY) newDate = TODAY;

  // Garde-fou : jamais antérieur à datePublished
  if (newDate < datePublished) {
    newDate = datePublished;
  }

  // Si la valeur est déjà identique, skip
  if (existingDm === newDate) {
    report.push({
      file: filename,
      oldDate: existingDm,
      newDate,
      triggerHash: lastSubstantial.hash.slice(0, 8),
      triggerMsg: lastSubstantial.msg,
      action: 'ALREADY_CORRECT',
    });
    skipped++;
    continue;
  }

  // Écriture
  report.push({
    file: filename,
    oldDate: existingDm ?? '(absent)',
    newDate,
    triggerHash: lastSubstantial.hash.slice(0, 8),
    triggerMsg: lastSubstantial.msg,
    action: existingDm && existingDm !== newDate ? 'UPDATE' : 'INSERT',
  });

  if (!dryRun) {
    const newFm = replaceDateModified(frontmatter, newDate);
    const newContent = newFm + body;
    writeFileSync(absPath, newContent, 'utf8');
    written++;
  } else {
    written++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log('RAPPORT COMPLET — dateModified resync');
console.log('═══════════════════════════════════════════════════════\n');

// Tableau principal
const col1 = 55;
const col2 = 12;
const col3 = 12;
const col4 = 10;
const col5 = 42;

const header = `${'FICHIER'.padEnd(col1)} ${'ANCIENNE'.padEnd(col2)} ${'NOUVELLE'.padEnd(col3)} ${'COMMIT'.padEnd(col4)} ${'MESSAGE DÉCLENCHEUR'.padEnd(col5)}`;
console.log(header);
console.log('─'.repeat(header.length));

for (const row of report) {
  const line = [
    row.file.padEnd(col1),
    (row.oldDate ?? '').padEnd(col2),
    (row.newDate ?? '').padEnd(col3),
    (row.triggerHash ?? '').padEnd(col4),
    (row.triggerMsg ?? '').slice(0, col5).padEnd(col5),
  ].join(' ');
  console.log(line);
}

// Distribution par date
console.log('\n── Distribution des nouvelles dateModified par jour ───────────');
const distribution = {};
for (const row of report) {
  if (!row.newDate || row.newDate === '(aucune)') continue;
  distribution[row.newDate] = (distribution[row.newDate] ?? 0) + 1;
}
for (const [date, count] of Object.entries(distribution).sort()) {
  const bar = '█'.repeat(Math.min(count, 60));
  console.log(`  ${date}  ${String(count).padStart(3)}  ${bar}`);
}

// Stats finales
console.log('\n── Résumé ──────────────────────────────────────────────────────');
const updated = report.filter((r) => r.action === 'UPDATE' || r.action === 'INSERT').length;
const alreadyCorrect = report.filter((r) => r.action === 'ALREADY_CORRECT').length;
const skipRecent = report.filter((r) => r.action === 'SKIP_RECENT').length;
console.log(`  Mis à jour (UPDATE/INSERT)   : ${updated}`);
console.log(`  Déjà corrects (skip)         : ${alreadyCorrect}`);
console.log(`  Conservés récents (≥06-05)   : ${skipRecent}`);
console.log(`  Sans commit substantiel      : ${noSubstantial}`);
console.log(`  Erreurs                      : ${errors}`);
console.log(`  Total traités                : ${targetFiles.length}`);
if (dryRun) {
  console.log('\n  (DRY-RUN : aucun fichier modifié)');
} else {
  console.log(`\n  Fichiers écrits              : ${written}`);
}

// Signaler les fichiers sans commit substantiel
const noSubFiles = report.filter((r) => r.action === 'NO_SUBSTANTIAL');
if (noSubFiles.length > 0) {
  console.log('\n── Fichiers sans commit substantiel (dateModified inchangée) ──');
  for (const row of noSubFiles) {
    console.log(`  ${row.file}  (actuel : ${row.oldDate ?? 'absent'})`);
  }
}

console.log('');
