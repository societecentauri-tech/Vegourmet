#!/usr/bin/env node
/**
 * dedup-recipe-cards.mjs
 *
 * Corrige le DOUBLON de fiche recette + la perte des liens affiliés sur les
 * 134 pages recettes vegourmet (migration WP Delicious -> Next.js/MDX).
 *
 * Problème (vérifié sur content/recettes/*.mdx) :
 *   - (1) Fiche structurée = composant RecipeDeliciousCard alimenté par le
 *     frontmatter (ingredients/steps). MAIS steps DUPLIQUÉS (chaque étape 2×
 *     consécutives) et ingredients SANS liens affiliés.
 *   - (2) Bloc brut dupliqué = la fiche WP sérialisée en texte, en fin de corps
 *     MDX (de `## {titre}` au-dessus de la ligne `Auteur: [Chloé](…author…)`
 *     jusqu'à EOF). Les liens affiliés c3po.link sont UNIQUEMENT là (~9/recette,
 *     0 dans le frontmatter).
 *
 * Ce script, pour chaque recette :
 *   1. Parse les lignes d'ingrédients du bloc brut `-   [ ]  {qté} [{nom}]({url})`
 *      et récupère, PAR INDEX (alignement positionnel vérifié à 100 %, 0 mismatch
 *      sur 134 fichiers / 1470 ingrédients), l'URL affiliée + le texte lié exact.
 *   2. Enrichit le frontmatter : ajoute `affiliateUrl` et `affiliateText` à
 *      l'ingrédient correspondant (même index). `affiliateText` = sous-chaîne
 *      exactement liée sur WP (permet de ne lier que le nom, pas la quantité).
 *   3. Déduplique `steps:` : retire toute étape identique à l'étape conservée
 *      immédiatement précédente (règle universelle, sûre, sans perte de données ;
 *      no-op si aucun doublon consécutif).
 *   4. Supprime le bloc brut dupliqué (du `## ` ancré au-dessus de la signature
 *      `Auteur: [Chloé](https://vegourmet.fr/author/` jusqu'à EOF).
 *
 * Idempotent :
 *   - si plus aucune signature `Auteur: [Chloé](…author…` -> bloc déjà supprimé,
 *     on ne retouche pas le corps.
 *   - dédup steps = no-op si déjà dédupliqués.
 *   - n'ajoute pas `affiliateUrl` s'il est déjà présent (réécrit la même valeur).
 *
 * Le frontmatter est re-sérialisé via gray-matter (js-yaml) avec lineWidth=80
 * pour préserver le style de pliage `>-` existant (seul `heroImage.src` est
 * replié cosmétiquement, sans impact runtime).
 *
 * Usage :
 *   node scripts/dedup-recipe-cards.mjs --dry-run   # n'écrit rien, rapporte
 *   node scripts/dedup-recipe-cards.mjs             # applique
 *   node scripts/dedup-recipe-cards.mjs --report-json=/tmp/affiliate-report.json
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const RECIPES_DIR = path.join(process.cwd(), "content", "recettes");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reportJsonArg = args.find((a) => a.startsWith("--report-json="));
const reportJsonPath = reportJsonArg ? reportJsonArg.split("=")[1] : null;

// Signature fiable du début du bloc brut WP (ligne Auteur).
const AUTEUR_SIG = /^Auteur:\s*\[Chloé\]\(https:\/\/vegourmet\.fr\/author\//;
// Ligne d'ingrédient cochable du bloc brut : `-   [ ]  {reste}`.
const RAW_ING_LINE = /^-   \[ \]  (.*)$/;
// Lien markdown c3po dans une ligne d'ingrédient : [texte](https://c3po.link/…).
const C3PO_LINK = /\[([^\]]+)\]\((https:\/\/c3po\.link\/[^)]+)\)/;

/**
 * Parse les lignes d'ingrédients du bloc brut (corps MDX) dans l'ordre.
 * @returns {{linkedText:string|null, url:string|null}[]}
 */
function parseRawIngredients(bodyLines) {
  const out = [];
  for (const line of bodyLines) {
    const m = line.match(RAW_ING_LINE);
    if (!m) continue;
    const lm = m[1].match(C3PO_LINK);
    out.push({ linkedText: lm ? lm[1] : null, url: lm ? lm[2] : null });
  }
  return out;
}

/**
 * Trouve l'index de ligne (0-based) du début du bloc brut WP :
 * le `## ` immédiatement au-dessus de la 1ʳᵉ ligne `Auteur: [Chloé](…author…`.
 * @returns {number} index du `## ` de début, ou -1 si pas de bloc brut.
 */
function findRawBlockStart(bodyLines) {
  let auteurIdx = -1;
  for (let i = 0; i < bodyLines.length; i++) {
    if (AUTEUR_SIG.test(bodyLines[i])) {
      auteurIdx = i;
      break;
    }
  }
  if (auteurIdx === -1) return -1;
  // Remonter au `## ` le plus proche au-dessus de la signature Auteur.
  for (let i = auteurIdx - 1; i >= 0; i--) {
    if (/^## /.test(bodyLines[i])) return i;
  }
  return -1; // signature présente mais pas de `## ` au-dessus (anomalie)
}

/** Dédup consécutif des steps (retire les doublons immédiats). */
function dedupSteps(steps) {
  const out = [];
  for (const s of steps) {
    const text = (s && typeof s.text === "string" ? s.text : "").trim();
    if (out.length === 0 || out[out.length - 1].text !== text) {
      out.push({ text });
    }
  }
  return out;
}

const files = readdirSync(RECIPES_DIR)
  .filter((f) => f.endsWith(".mdx"))
  .sort();

let touched = 0;
const perRecipe = [];
const anomalies = [];

for (const file of files) {
  const full = path.join(RECIPES_DIR, file);
  const original = readFileSync(full, "utf-8");
  const parsed = matter(original);
  const data = parsed.data;
  const bodyLines = parsed.content.split("\n");

  // --- 1) Liens affiliés du bloc brut (avant suppression) ---
  const rawIngs = parseRawIngredients(bodyLines);
  const fmIngs = Array.isArray(data.ingredients) ? data.ingredients : [];
  const c3poInBodyBefore = rawIngs.filter((r) => r.url).length;

  let countMismatch = false;
  if (rawIngs.length !== fmIngs.length) {
    countMismatch = true;
    anomalies.push(
      `${file}: alignement KO (fm=${fmIngs.length} raw=${rawIngs.length}) — liens NON portés`,
    );
  }

  let affiliateAdded = 0;
  if (!countMismatch) {
    for (let i = 0; i < fmIngs.length; i++) {
      const r = rawIngs[i];
      if (r && r.url) {
        // Sécurité : le texte lié doit être une sous-chaîne du nom frontmatter.
        if (typeof fmIngs[i].name === "string" && fmIngs[i].name.includes(r.linkedText)) {
          fmIngs[i].affiliateUrl = r.url;
          fmIngs[i].affiliateText = r.linkedText;
        } else {
          fmIngs[i].affiliateUrl = r.url; // on porte l'URL même si le texte ne matche pas
          anomalies.push(
            `${file} [ing ${i}]: texte lié "${r.linkedText}" absent du nom "${fmIngs[i].name}" — affiliateText omis`,
          );
        }
        affiliateAdded++;
      }
    }
  }

  // --- 2) Dédup steps ---
  const stepsBefore = Array.isArray(data.steps) ? data.steps.length : 0;
  if (Array.isArray(data.steps)) {
    data.steps = dedupSteps(data.steps);
  }
  const stepsAfter = Array.isArray(data.steps) ? data.steps.length : 0;

  // --- 3) Suppression du bloc brut ---
  const startIdx = findRawBlockStart(bodyLines);
  let newBody = parsed.content;
  let blockRemoved = false;
  if (startIdx >= 0) {
    // Couper du `## ` de début jusqu'à EOF. On retire aussi les lignes vides
    // qui précèdent immédiatement, pour ne pas laisser de trous en fin de corps.
    let cut = startIdx;
    while (cut > 0 && bodyLines[cut - 1].trim() === "") cut--;
    newBody = bodyLines.slice(0, cut).join("\n");
    // Normaliser : exactement un saut de ligne final.
    newBody = newBody.replace(/\s+$/, "") + "\n";
    blockRemoved = true;
  } else {
    const hasAuteur = bodyLines.some((l) => AUTEUR_SIG.test(l));
    if (hasAuteur) {
      anomalies.push(`${file}: signature Auteur présente mais aucun '## ' au-dessus — bloc NON supprimé`);
    }
  }

  // --- Comptage liens après (frontmatter affiliateUrl) ---
  const c3poInFmAfter = fmIngs.filter(
    (ing) => typeof ing.affiliateUrl === "string" && ing.affiliateUrl.includes("c3po.link"),
  ).length;

  // --- Sérialisation ---
  const newContent = matter.stringify(newBody, data, { lineWidth: 80 });

  const changed = newContent !== original;
  if (changed) {
    if (!dryRun) writeFileSync(full, newContent, "utf-8");
    touched++;
  }

  perRecipe.push({
    file,
    c3poInBodyBefore,
    c3poInFmAfter,
    delta: c3poInFmAfter - c3poInBodyBefore,
    affiliateAdded,
    stepsBefore,
    stepsAfter,
    blockRemoved,
    countMismatch,
    changed,
  });
}

// ---- Rapport ----
const totalBefore = perRecipe.reduce((a, r) => a + r.c3poInBodyBefore, 0);
const totalAfter = perRecipe.reduce((a, r) => a + r.c3poInFmAfter, 0);
const lostRecipes = perRecipe.filter((r) => r.delta < 0);
const blocksRemoved = perRecipe.filter((r) => r.blockRemoved).length;

console.log(`${dryRun ? "[DRY-RUN] " : ""}Recettes scannées      : ${files.length}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Recettes modifiées     : ${touched}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Blocs bruts supprimés  : ${blocksRemoved}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Liens c3po (corps avant): ${totalBefore}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Liens c3po (FM après)   : ${totalAfter}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Delta liens (≥0 attendu): ${totalAfter - totalBefore}`);
console.log(`${dryRun ? "[DRY-RUN] " : ""}Recettes avec PERTE     : ${lostRecipes.length}`);

if (lostRecipes.length > 0) {
  console.log("\n⚠️  PERTE de liens sur :");
  for (const r of lostRecipes) {
    console.log(`  - ${r.file}: avant=${r.c3poInBodyBefore} après=${r.c3poInFmAfter} (delta ${r.delta})`);
  }
}

if (anomalies.length > 0) {
  console.log(`\nAnomalies (${anomalies.length}) :`);
  for (const a of anomalies) console.log(`  - ${a}`);
}

if (reportJsonPath) {
  writeFileSync(
    reportJsonPath,
    JSON.stringify(
      { totalBefore, totalAfter, blocksRemoved, touched, perRecipe, anomalies },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`\nRapport JSON détaillé : ${reportJsonPath}`);
}
