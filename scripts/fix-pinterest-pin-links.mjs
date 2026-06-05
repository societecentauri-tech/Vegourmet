#!/usr/bin/env node
/**
 * fix-pinterest-pin-links.mjs
 *
 * Corrige une fuite markdown systémique introduite par la migration HTML→MDX
 * sur les pages recettes de vegourmet.
 *
 * Bug : la structure d'origine WordPress `[![ALT](IMG)](LIEN_PINTEREST)`
 *       (image cliquable qui épingle sur Pinterest) a perdu le `[` d'ouverture.
 *       Deux variantes observées :
 *         - sans espace  : `![ALT](IMG)](https://www.pinterest…)`   (90 fichiers)
 *         - avec espace  : `![ALT](IMG) ](https://www.pinterest…)`  (44 fichiers)
 *       Dans les deux cas, `![ALT](IMG)` rend l'image puis ` ](LIEN)` / `](LIEN)`
 *       fuit en texte brut visible.
 *
 * Fix (fidèle à WP, « à l'identique ») : restaurer `[![ALT](IMG)](LIEN_PINTEREST)`
 *   1. supprimer les espaces éventuels entre le `)` de l'image et `](https://www.pinterest`
 *   2. préfixer un `[` en début de ligne (devant le `![`)
 *
 * Idempotent : si la ligne commence déjà par `[![` (déjà corrigée) → on ne touche pas.
 * Gère plusieurs occurrences par fichier (boucle ligne par ligne).
 * Robuste aux crochets `[...]` présents DANS le texte ALT : on n'analyse pas l'ALT,
 * on s'ancre sur la structure (ligne commençant par `![` + présence de `…)](pinterest`).
 *
 * Usage :
 *   node scripts/fix-pinterest-pin-links.mjs [--dry-run] [glob...]
 *   (par défaut : content/recettes/*.mdx)
 */

import { readFileSync, writeFileSync, globSync } from 'node:fs';
import path from 'node:path';

const PIN_URL = 'https://www.pinterest.com/pin/create';

// Fin de la fuite : `)` de l'image + espaces optionnels + `](pinterest…`.
//   group 1 = l'URL Pinterest (réinjectée telle quelle)
const LEAK_END = /\)\s*\]\((https:\/\/www\.pinterest\.com\/pin\/create)/g;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const patterns = args.filter((a) => !a.startsWith('--'));
const globs = patterns.length > 0 ? patterns : ['content/recettes/*.mdx'];

let files = [];
for (const g of globs) files = files.concat(globSync(g));
files = [...new Set(files)].sort();

let totalFilesTouched = 0;
let totalOccurrences = 0;
const touchedFiles = [];

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let fileOccurrences = 0;

  const fixed = lines.map((line) => {
    // 1) La ligne doit référencer un bouton d'épinglage Pinterest.
    if (!line.includes(PIN_URL)) return line;

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const body = line.slice(indent.length);

    // 2) Idempotence : déjà corrigé (commence par `[![`) → on ne touche pas.
    if (body.startsWith('[![')) return line;

    // 3) On ne corrige que le motif réel : image en début de ligne `![ALT](IMG)…](pin)`.
    if (!body.startsWith('![')) return line;

    // 4) Confirmer la présence du `)` d'image suivi (espaces opt.) de `](pinterest`.
    LEAK_END.lastIndex = 0;
    if (!LEAK_END.test(body)) return line;

    fileOccurrences += 1;

    // a) Supprimer les espaces parasites entre `)` (fin image) et `](pinterest…`.
    LEAK_END.lastIndex = 0;
    let newBody = body.replace(LEAK_END, ')]($1');
    // b) Restaurer le `[` d'ouverture du lien englobant, indentation préservée.
    return `${indent}[${newBody}`;
  });

  if (fileOccurrences > 0) {
    const newContent = fixed.join('\n');
    if (newContent !== original) {
      if (!dryRun) writeFileSync(file, newContent, 'utf8');
      totalFilesTouched += 1;
      totalOccurrences += fileOccurrences;
      touchedFiles.push(`${path.relative(process.cwd(), file)} (${fileOccurrences})`);
    }
  }
}

console.log(`${dryRun ? '[DRY-RUN] ' : ''}Fichiers scannés     : ${files.length}`);
console.log(`${dryRun ? '[DRY-RUN] ' : ''}Fichiers modifiés    : ${totalFilesTouched}`);
console.log(`${dryRun ? '[DRY-RUN] ' : ''}Occurrences corrigées: ${totalOccurrences}`);
if (touchedFiles.length > 0) {
  console.log('\nDétail :');
  for (const f of touchedFiles) console.log(`  - ${f}`);
}
