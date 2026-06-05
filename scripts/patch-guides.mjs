#!/usr/bin/env node
/**
 * patch-guides.mjs — VOLET 2 : JumpToWinner + faqTitle sur les 18 guides.
 *
 * Pour chaque guide :
 * 1. Injecte `faqTitle:` dans le frontmatter YAML.
 * 2. Ajoute `<JumpToWinner targetId="tableau-comparatif" />` après l'intro
 *    (après le premier grand paragraphe, avant le 1er H3 de corps).
 * 3. Ajoute `<a id="tableau-comparatif" />` juste avant la section winner
 *    (`### Le meilleur X testé et approuvé`).
 *
 * Usage :
 *   node scripts/patch-guides.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

// ─── Data : faqTitle par slug ─────────────────────────────────────────────────
const GUIDE_FAQ_TITLES = {
  "meilleure-whey-vegan-guide-complet-choisir-2025": "FAQ – Meilleure whey vegan",
  "les-meilleures-proteines-vegetales-musculation": "FAQ : Protéines végétales et musculation",
  "le-meilleur-seitan-guide-comparatif-marques-2025": "FAQ",
  "meilleur-tempeh-avis-et-guide-complet-2025": "FAQ : Tout savoir sur le tempeh",
  "meilleur-lait-vegetal-pour-le-chocolat-chaud-guide": "FAQ",
  "meilleur-hache-vegetal-avis-test-complet-2025": "FAQ : Tout savoir sur les hachés végétaux",
  "meilleure-proteine-vegan-guide-complet-2025": "FAQ",
  "meilleur-tofu-fume-guide-ultime-pour-vos-plats-vegan": "FAQ : Vos questions sur le tofu fumé",
  "meilleur-yaourt-vegetal-avis-tests-guide-complet": "FAQ",
  "meilleure-margarine-pour-la-sante-guide-complet": "FAQ : Vos questions sur la margarine et la santé",
  "meilleur-fromage-vegan-decouvrez-guide-complet-2025": "FAQ : Meilleur Fromage Vegan",
  "meilleur-lait-vegetal-pour-maigrir-guide-comparatif": "FAQ : Laits végétaux et perte de poids",
  "meilleur-tofu-guide-complet-pour-le-choisir": "FAQ : vos questions sur le meilleur tofu",
  "meilleur-lait-vegetal-pour-cafe-guide-complet-2025": "FAQ : Vos questions sur les laits végétaux pour café",
  "meilleur-lait-vegetal-pour-la-musculation-guide": "FAQ : Vos questions sur les laits et la musculation",
  "meilleure-margarine-pour-la-patisserie-guide-complet": "FAQ",
  "meilleur-lait-vegetal-pour-mousser-guide-complet": "FAQ : vos questions sur les laits végétaux pour le café",
  "quel-est-le-meilleur-lait-vegetal-pour-la-sante": "FAQ : Les questions fréquentes sur les laits végétaux",
};

/** Extrait le slug depuis le nom de fichier. */
function slugFromPath(filePath) {
  return filePath.replace(/^.*\//, "").replace(/\.mdx$/, "");
}

/**
 * Trouve le premier H3 dans le body (1re ligne `^### `).
 * Retourne l'index de ligne ou -1.
 */
function findFirstH3(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^### /.test(lines[i])) return i;
  }
  return -1;
}

/**
 * Trouve la section winner : `### Le meilleur X testé et approuvé`
 * Ou plus généralement `### Le/La meilleur(e)` dans la 2e moitié du fichier.
 * Retourne l'index de ligne ou -1.
 */
function findWinnerSection(lines) {
  // Cherche un pattern : `### Le meilleur|La meilleure|Les meilleurs` + `testé`
  const halfPoint = Math.floor(lines.length / 2);
  for (let i = halfPoint; i < lines.length; i++) {
    const t = lines[i];
    if (
      /^### /.test(t) &&
      /meilleur|meilleure|meilleures|gagnant/i.test(t) &&
      /test|approuv|choisi|sélection/i.test(t)
    ) {
      return i;
    }
  }
  // Fallback : cherche simplement "🏆 GAGNANT" ou "GAGNANT"
  for (let i = 0; i < lines.length; i++) {
    if (/🏆|GAGNANT/.test(lines[i])) {
      // Remonter pour trouver le H3 précédent
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        if (/^### /.test(lines[j])) return j;
      }
      return i;
    }
  }
  return -1;
}

function patchGuide(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`❌ Fichier introuvable : ${absPath}`);
    return false;
  }

  const slug = slugFromPath(filePath);
  const faqTitle = GUIDE_FAQ_TITLES[slug];
  if (!faqTitle) {
    console.log(`⏭️  ${slug} : slug non trouvé dans le mapping, ignoré`);
    return true;
  }

  const original = readFileSync(absPath, "utf8");
  const content = original.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // ── 1. Vérifier si déjà patché ────────────────────────────────────────────
  if (content.includes("JumpToWinner") || content.includes('id="tableau-comparatif"')) {
    console.log(`✅ ${slug} : déjà patché`);
    return true;
  }

  // ── 2. Frontmatter : injecter faqTitle ───────────────────────────────────
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`❌ Pas de frontmatter : ${slug}`);
    return false;
  }
  let frontmatter = fmMatch[1];
  const body = fmMatch[2];

  // Ajouter faqTitle avant la ligne `---` de fermeture si absent
  if (!frontmatter.includes("faqTitle:")) {
    const escapedTitle = faqTitle.replace(/'/g, "\\'");
    frontmatter = frontmatter.replace(
      /^---\n$/m,
      `faqTitle: '${escapedTitle}'\n---\n`
    );
  }

  // ── 3. Body : ajouter JumpToWinner + ancre ────────────────────────────────
  const bodyLines = body.split("\n");

  // Position pour JumpToWinner : après le premier H3 de corps
  const firstH3 = findFirstH3(bodyLines);
  const jumpLine = firstH3 !== -1 ? firstH3 : 0;

  // Position pour l'ancre : avant la section winner
  const winnerLine = findWinnerSection(bodyLines);

  if (winnerLine === -1) {
    console.warn(`⚠️  ${slug} : section winner non trouvée — ancre ignorée`);
  }

  // Insérer de la fin vers le début pour ne pas décaler les indices
  const newLines = [...bodyLines];

  // 3b. Ancre juste AVANT la section winner (si trouvée)
  if (winnerLine !== -1) {
    // Chercher une ligne vide avant, pour insérer proprement
    newLines.splice(winnerLine, 0, '<a id="tableau-comparatif" />', "");
  }

  // 3a. JumpToWinner juste APRÈS le premier H3 (avant le paragraphe suivant)
  // Recalculer l'index après l'insertion précédente
  const adjustedJumpLine = winnerLine !== -1 && jumpLine >= winnerLine
    ? jumpLine + 2
    : jumpLine;

  // Insérer après le H3 et sa ligne vide suivante
  let insertAfter = adjustedJumpLine + 1;
  // Passer les lignes vides après le H3
  while (insertAfter < newLines.length && newLines[insertAfter].trim() === "") {
    insertAfter++;
  }
  // Insérer avant le premier contenu textuel après le H3
  newLines.splice(insertAfter, 0, "<JumpToWinner targetId=\"tableau-comparatif\" />", "");

  let newBody = newLines.join("\n");
  // Éviter les quadruples sauts de ligne
  newBody = newBody.replace(/\n{4,}/g, "\n\n\n");

  const newContent = frontmatter + newBody;

  console.log(`\n📄 ${slug}`);
  console.log(`   faqTitle: "${faqTitle}"`);
  console.log(
    `   JumpToWinner après H3 ligne ${adjustedJumpLine}`
  );
  console.log(
    winnerLine !== -1
      ? `   Ancre avant winner ligne ${winnerLine}`
      : `   ⚠️  Ancre : section winner non trouvée`
  );

  if (dryRun) {
    // Afficher les premières occurrences de JumpToWinner et ancre
    const previewLines = newContent.split("\n");
    const jumpIdx = previewLines.findIndex((l) => l.includes("JumpToWinner"));
    const anchorIdx = previewLines.findIndex((l) =>
      l.includes('id="tableau-comparatif"')
    );
    const faqIdx = previewLines.findIndex((l) => l.includes("faqTitle:"));
    if (faqIdx !== -1)
      console.log(`   FM: ${previewLines[faqIdx]}`);
    if (jumpIdx !== -1)
      console.log(`   JUMP: ${previewLines.slice(jumpIdx, jumpIdx + 3).join(" | ")}`);
    if (anchorIdx !== -1)
      console.log(
        `   ANCRE: ${previewLines.slice(anchorIdx, anchorIdx + 3).join(" | ")}`
      );
    return true;
  }

  writeFileSync(absPath, newContent, "utf8");
  console.log(`   💾 Écrit`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const guides = Object.keys(GUIDE_FAQ_TITLES).map(
  (slug) => `content/blog/${slug}.mdx`
);

console.log(
  `\n🌱 patch-guides.mjs — ${dryRun ? "MODE DRY-RUN" : "ÉCRITURE"}`
);
console.log(`   Guides : ${guides.length}`);

let ok = 0,
  ko = 0;
for (const f of guides) {
  if (patchGuide(f)) ok++;
  else ko++;
}
console.log(`\n✅ ${ok} traité(s), ❌ ${ko} erreur(s)\n`);
if (ko > 0) process.exit(1);
