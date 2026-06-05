#!/usr/bin/env node
/**
 * convert-combos.mjs — Conversion du bloc « combos » Markdown nu → JSX MDX.
 *
 * Contexte : lors de la migration WP→Next, le bloc WP « Ces X se marient à
 * merveille avec… » (cartes : image + titre + sous-titre + citation + flèche)
 * a été aplati en Markdown nu. Les liens markdown enchaînés rendent du texte
 * brut visible à l'écran : `[![alt](img)` … `#### Titre` … `→](url)`.
 * Ce sont les « caractères bizarres » signalés par Greg (174/178 pages).
 *
 * Marqueur fiable et universel : la CHAÎNE de cartes elle-même.
 *   - Une carte = `[![alt](img)` … (lignes) … `→](url)`.
 *   - Cartes consécutives jointes par `→](url) [![alt](img)`.
 *   - Le titre = le `### <titre>` qui précède immédiatement la chaîne.
 *   - Le sous-titre = le paragraphe entre ce `###` et le premier `[![`.
 *   - La ligne orpheline « Les combos parfaits » (quand présente, juste avant
 *     le `###`) est supprimée (légende résiduelle WP).
 *
 * Sortie :
 *   <RecipeCombos title="…" subtitle="…">
 *     <RecipeComboCard image="…" imageAlt="…" title="…" subtitle="…"
 *       quote="…" href="/recettes/…" />
 *     …
 *   </RecipeCombos>
 *
 * Props string scalaires uniquement (gotcha MDX : les props array/object ne
 * passent pas dans next-mdx-remote via les attributs JSX string).
 * Liens INTERNES : `https://vegourmet.fr/recettes/…` → `/recettes/…`.
 *
 * Usage :
 *   node scripts/convert-combos.mjs [--dry-run] <fichier.mdx> [...]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0) {
  console.error(
    "Usage : node scripts/convert-combos.mjs [--dry-run] <fichier.mdx> [...]"
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Encode pour prop JSX string (délimiteur " + accolades JSX). */
function escapeJsx(str) {
  return str
    .replace(/"/g, "&quot;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

/**
 * Transforme un href en lien interne.
 *   https://vegourmet.fr/recettes/slug/  → /recettes/slug
 *   https://vegourmet.fr/...             → /...
 * Les liens déjà relatifs sont conservés. Le trailing slash est retiré.
 */
function toInternalHref(href) {
  let h = href.trim();
  h = h.replace(/^https?:\/\/(www\.)?vegourmet\.fr/i, "");
  if (!h.startsWith("/")) h = "/" + h;
  // Retirer un trailing slash (sauf racine)
  if (h.length > 1) h = h.replace(/\/+$/, "");
  return h;
}

/** Retire les guillemets typographiques/ASCII encadrants d'une citation. */
function stripQuotes(str) {
  return str.replace(/^[“"«»]\s*/, "").replace(/\s*[”"«»]$/, "").trim();
}

/**
 * Localise la chaîne de cartes combos dans les lignes du corps.
 *
 * Détection : première ligne qui démarre par `[![` (ouverture du lien-image
 * de la 1re carte), jusqu'à la ligne contenant `→](url)` qui n'est PAS suivie
 * (sur la même ligne) d'un nouveau `[![` (= dernière carte).
 *
 * Retourne { titleIdx, subtitleIdx, legendIdx, chainStart, chainEnd } ou null.
 *  - chainStart : index de la ligne `[![…` de la 1re carte.
 *  - chainEnd   : index (exclusif) de la fin de la chaîne.
 *  - titleIdx   : index du `### <titre>` précédent (ou -1).
 *  - subtitleIdx: index du paragraphe sous-titre (ou -1).
 *  - legendIdx  : index de « Les combos parfaits » (ou -1).
 */
function findCombosBlock(lines) {
  // 1) Trouver l'ouverture de la 1re carte : ligne commençant par `[![`
  //    ET dont le bloc se referme plus loin par `→](`.
  let chainStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\[!\[/.test(lines[i].trim())) {
      // Vérifier qu'un `→](` apparaît plus bas (sinon c'est une simple image liée)
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        if (lines[j].trim().startsWith("→](")) {
          chainStart = i;
          break;
        }
      }
      if (chainStart !== -1) break;
    }
  }
  if (chainStart === -1) return null;

  // 2) Trouver la fin de la chaîne : ligne `→](…)` finale.
  //    Une ligne `→](url) [![…` poursuit la chaîne ; une ligne `→](url)` seule
  //    (sans `[![` à la suite) la termine.
  let chainEnd = -1;
  for (let i = chainStart; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("→](")) {
      // La carte suivante démarre-t-elle sur cette même ligne ?
      if (!/\[!\[/.test(t)) {
        chainEnd = i + 1;
        break;
      }
    }
  }
  if (chainEnd === -1) return null;

  // 3) Remonter pour trouver le titre `###`, le sous-titre et la légende.
  let titleIdx = -1;
  let subtitleIdx = -1;
  let legendIdx = -1;
  for (let i = chainStart - 1; i >= 0 && i >= chainStart - 8; i--) {
    const t = lines[i].trim();
    if (t === "") continue;
    if (/^###\s+/.test(t)) {
      titleIdx = i;
      break;
    }
    // Premier paragraphe non vide rencontré en remontant = sous-titre
    if (subtitleIdx === -1 && !t.startsWith("#") && !t.startsWith("![")) {
      subtitleIdx = i;
    }
  }
  // Légende orpheline « Les combos parfaits » juste avant le titre
  if (titleIdx > 0) {
    for (let i = titleIdx - 1; i >= 0 && i >= titleIdx - 3; i--) {
      const t = lines[i].trim();
      if (t === "") continue;
      if (/^les combos parfaits$/i.test(t)) legendIdx = i;
      break;
    }
  }

  return { titleIdx, subtitleIdx, legendIdx, chainStart, chainEnd };
}

/**
 * Parse les cartes depuis les lignes de la chaîne.
 * Chaque carte : `[![alt](img)` … `#### Titre` … sous-titre … `"citation"` … `→](url)`.
 */
function parseCombos(lines) {
  // Reconstituer le texte de la chaîne puis re-segmenter par carte.
  // Les segments sont délimités par les `[![` (ouverture) et `→](` (fermeture).
  const cards = [];
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    // Ouverture de carte : ligne qui contient `[![alt](img)` (éventuellement
    // précédée d'un `→](url) ` de fermeture de la carte précédente).
    const imgMatch = t.match(/\[!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (!imgMatch) {
      i++;
      continue;
    }
    const imageAlt = imgMatch[1];
    const image = imgMatch[2];
    i++;

    // Titre #### …
    while (i < lines.length && lines[i].trim() === "") i++;
    let title = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^#{3,4}\s+(.+)$/);
      if (m) {
        title = m[1].trim();
        i++;
      }
    }

    // Sous-titre (paragraphe simple)
    while (i < lines.length && lines[i].trim() === "") i++;
    let subtitle = "";
    if (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^[“"«]/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("→](")
    ) {
      subtitle = lines[i].trim();
      i++;
    }

    // Citation (entre guillemets typographiques)
    while (i < lines.length && lines[i].trim() === "") i++;
    let quote = "";
    if (i < lines.length && /^[“"«]/.test(lines[i].trim())) {
      quote = stripQuotes(lines[i].trim());
      i++;
    }

    // Fermeture → href (ligne `→](url)` éventuellement suivie de `[![` suivant)
    while (i < lines.length && lines[i].trim() === "") i++;
    let href = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^→\]\(([^)]+)\)/);
      if (m) {
        href = m[1];
        // Si la carte suivante démarre sur la même ligne, NE PAS avancer i :
        // la prochaine itération relira cette ligne pour capter le `[![`.
        if (/\[!\[/.test(lines[i].trim())) {
          // Réécrire la ligne courante pour ne garder que le `[![…` suivant
          lines[i] = lines[i].trim().replace(/^→\]\([^)]+\)\s*/, "");
        } else {
          i++;
        }
      }
    }

    if (title && href) {
      cards.push({
        image,
        imageAlt,
        title,
        subtitle,
        quote,
        href: toInternalHref(href),
      });
    }
  }

  return cards;
}

/** Génère le JSX RecipeCombos + RecipeComboCard(s). */
function buildCombosJsx(title, subtitle, cards) {
  if (cards.length === 0) return null;

  const cardJsx = cards.map((c) => {
    const attrs = [];
    if (c.image) attrs.push(`  image="${escapeJsx(c.image)}"`);
    if (c.imageAlt) attrs.push(`  imageAlt="${escapeJsx(c.imageAlt)}"`);
    attrs.push(`  title="${escapeJsx(c.title)}"`);
    if (c.subtitle) attrs.push(`  subtitle="${escapeJsx(c.subtitle)}"`);
    if (c.quote) attrs.push(`  quote="${escapeJsx(c.quote)}"`);
    attrs.push(`  href="${escapeJsx(c.href)}"`);
    return `  <RecipeComboCard\n${attrs.map((a) => "  " + a).join("\n")}\n  />`;
  });

  const open = [`<RecipeCombos`];
  if (title) open.push(`  title="${escapeJsx(title)}"`);
  if (subtitle) open.push(`  subtitle="${escapeJsx(subtitle)}"`);
  open.push(`>`);

  return [open.join("\n"), "", ...cardJsx.flatMap((j) => [j, ""]), `</RecipeCombos>`].join(
    "\n"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion d'un fichier
// ─────────────────────────────────────────────────────────────────────────────

function convertFile(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`❌ Fichier introuvable : ${absPath}`);
    return false;
  }

  const original = readFileSync(absPath, "utf8");
  const content = original.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`❌ Pas de frontmatter YAML : ${absPath}`);
    return false;
  }
  const frontmatter = fmMatch[1];
  const body = fmMatch[2];
  const bodyLines = body.split("\n");

  const block = findCombosBlock(bodyLines);
  if (!block) {
    console.log(`\n📄 ${filePath}\n   ℹ️  Pas de bloc combos détecté`);
    return true;
  }

  // Lignes de la chaîne (copie modifiable, parseCombos réécrit les fins de ligne)
  const chainLines = bodyLines.slice(block.chainStart, block.chainEnd).slice();
  const cards = parseCombos(chainLines);
  if (cards.length === 0) {
    console.log(`\n📄 ${filePath}\n   ⚠️  Chaîne trouvée mais 0 carte parsée`);
    return true;
  }

  const title =
    block.titleIdx !== -1
      ? bodyLines[block.titleIdx].trim().replace(/^###\s+/, "")
      : "";
  const subtitle =
    block.subtitleIdx !== -1 ? bodyLines[block.subtitleIdx].trim() : "";

  const jsx = buildCombosJsx(title, subtitle, cards);

  // Bornes de remplacement : de la légende (ou titre, ou sous-titre) jusqu'à
  // la fin de la chaîne. On absorbe la légende orpheline + titre + sous-titre.
  let repStart = block.chainStart;
  if (block.subtitleIdx !== -1 && block.subtitleIdx < repStart)
    repStart = block.subtitleIdx;
  if (block.titleIdx !== -1 && block.titleIdx < repStart) repStart = block.titleIdx;
  if (block.legendIdx !== -1 && block.legendIdx < repStart)
    repStart = block.legendIdx;
  const repEnd = block.chainEnd;

  const newLines = [...bodyLines];
  newLines.splice(repStart, repEnd - repStart, "", jsx, "");
  let newBody = newLines.join("\n");
  newBody = newBody.replace(/\n{4,}/g, "\n\n\n");

  const newContent = frontmatter + newBody;

  console.log(`\n📄 ${filePath}`);
  console.log(`   ✅ ${cards.length} carte(s) combos → <RecipeCombos>`);
  console.log(`      titre : ${title || "(aucun)"}`);
  const absLinks = cards.filter((c) => /^https?:/.test(c.href));
  if (absLinks.length > 0) {
    console.log(`   ⚠️  ${absLinks.length} lien(s) NON internalisé(s)`);
  }

  if (dryRun) {
    const idx = newContent.split("\n").findIndex((l) => l.includes("<RecipeCombos"));
    console.log("\n   ── Aperçu ──");
    console.log(newContent.split("\n").slice(idx, idx + 24).join("\n"));
    return true;
  }

  const backupPath = absPath + ".orig";
  if (!existsSync(backupPath)) writeFileSync(backupPath, original, "utf8");
  writeFileSync(absPath, newContent, "utf8");
  console.log(`   💾 Écrit (backup : ${backupPath.split("/").pop()})`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n🌱 convert-combos.mjs — ${dryRun ? "MODE DRY-RUN" : "ÉCRITURE"}`);
console.log(`   Fichiers : ${files.length}`);

let ok = 0;
let ko = 0;
for (const f of files) {
  if (convertFile(f)) ok++;
  else ko++;
}
console.log(`\n✅ ${ok} traité(s), ❌ ${ko} erreur(s)\n`);
if (ko > 0) process.exit(1);
