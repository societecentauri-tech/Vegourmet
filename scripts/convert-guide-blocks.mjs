#!/usr/bin/env node
/**
 * convert-guide-blocks.mjs — Conversion des blocs comparatifs Markdown → JSX MDX.
 *
 * Objectif : transformer les 19 pages guides vegourmet dont les blocs HTML
 * custom WordPress ont été aplatis en Markdown nu lors de la migration.
 *
 * Ce script :
 * 1. Supprime les titres techniques fuités (regex cadratin U+2013).
 * 2. Parse la séquence Markdown régulière des cartes produit et émet
 *    <ComparisonTable><ProductCard .../></ComparisonTable>.
 * 3. Parse le bloc Greenweez CTA et émet <GreenweezCta .../>.
 * 4. Migre la FAQ du corps vers le frontmatter `faq:` (si présente).
 *
 * Usage :
 *   node scripts/convert-guide-blocks.mjs [--dry-run] <fichier.mdx> [...]
 *
 * Sans --dry-run : écrit les fichiers en place (backup .orig automatique).
 * Avec --dry-run  : affiche un aperçu du résultat sans rien écrire.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0) {
  console.error(
    "Usage : node scripts/convert-guide-blocks.mjs [--dry-run] <fichier.mdx> [...]"
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode une chaîne pour prop JSX string.
 * - Les guillemets doubles sont remplacés par &quot; (délimiteur du prop)
 * - { et } sont échappés pour éviter d'être interprétés comme des expressions JSX
 * - & dans les URLs doit rester littéral (les entités &amp; seraient rendues telles quelles)
 */
function escapeJsx(str) {
  return str
    .replace(/"/g, "&quot;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

/** Échappe pour YAML (guillemets simples → doublés). */
function escapeYaml(str) {
  return str.replace(/'/g, "''");
}

/**
 * Détermine la variante du badge à partir de son libellé.
 *   "Épicé" → spicy (terracotta)
 *   "Polyvalent" → versatile (olive)
 *   Autres → default (or)
 */
function badgeVariant(label) {
  const l = label.toLowerCase();
  if (l.includes("épic") || l.includes("epice")) return "spicy";
  if (l.includes("polyvalent") || l.includes("versatile")) return "versatile";
  return "default";
}

/**
 * Parse les specs d'une ligne Markdown du style :
 *   "⭐ ★★★★★ 💰 3,29€ 📦 180g"
 *   "★★★★☆ 3,15€ 200g"
 * Retourne { rating, price, extra }.
 */
function parseSpecs(line) {
  // Rating : séquence d'étoiles Unicode (★/☆)
  const ratingMatch = line.match(/[⭐\s]*(★[★☆]+)/);
  const rating = ratingMatch ? ratingMatch[1].trim() : "";

  // Price : 💰 suivi d'un nombre€, ou nombre€ seul
  const priceMatch = line.match(/💰\s*([\d,.]+\s*€)|([\d,.]+\s*€)/);
  const price = priceMatch ? (priceMatch[1] || priceMatch[2]).trim() : "";

  // Extra : ce qui reste une fois rating et price retirés
  let rest = line
    .replace(/[⭐]\s*/, "")
    .replace(/★[★☆]+/, "")
    .replace(/💰\s*[\d,.]+\s*€/, "")
    .replace(/[\d,.]+\s*€/, "")
    .replace(/📦\s*/, "")
    .trim()
    .replace(/\s+/g, " ");
  const extra = rest || "";

  return { rating, price, extra };
}

/**
 * Localise le bloc cartes dans un tableau de lignes.
 * Retourne { titleLine, cardsStart, cardsEnd } ou null.
 *
 * Marqueur de début : ### <titre> suivi (sous 10 lignes) de "🏆 GAGNANT".
 * Marqueur de fin   : #### Mes | ### Conclusion | ### FAQ | fin du tableau.
 */
function findCardsBlock(lines) {
  for (let i = 0; i < lines.length - 3; i++) {
    const line = lines[i].trim();
    if (/^###\s+/.test(line) && !line.startsWith("### [")) {
      // Chercher "🏆 GAGNANT" dans les 10 lignes suivantes
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].trim() === "🏆 GAGNANT") {
          // Trouver la fin du bloc
          let end = lines.length;
          for (let k = i + 1; k < lines.length; k++) {
            const kl = lines[k].trim();
            if (/^#{2,4}\s+(Mes|Conclusion|FAQ|Quel)/i.test(kl)) {
              end = k;
              break;
            }
          }
          return { titleLine: line, cardsStart: i, cardsEnd: end };
        }
      }
    }
  }
  return null;
}

/**
 * Parse les cartes produit depuis un tableau de lignes (hors ligne titre).
 *
 * Séquence par carte :
 *   <badge>          → "🏆 GAGNANT" | "Épicé" | "Polyvalent" | ...
 *   ![alt](url)      → image
 *   🥇/🥈/🥉         → rang (ligne seule)
 *   ### [nom](href)  → titre + lien
 *   <specs>          → rating price extra
 *   **Mon avis :** … → avis
 *   ✨ Parfait pour  → tags
 *   [cta](href)      → bouton
 */
function parseCards(lines) {
  const cards = [];
  let i = 0;

  // Emojis médaille (2 code units en JS, donc pas de character class)
  const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

  /**
   * Retourne true si une ligne est un marqueur de début de carte.
   * Critères : court (< 50 car), pas image/heading/lien/avis/tag/quote/liste,
   * et soit contient "GAGNANT", soit est un mot simple sans ponctuation complexe.
   */
  function isBadge(line) {
    const t = line.trim();
    if (!t || t.length > 50) return false;
    if (t.startsWith("!") || t.startsWith("[") || t.startsWith("#")) return false;
    if (t.startsWith("**") || t.startsWith("✨") || t.startsWith(">")) return false;
    if (t.startsWith("-") || t.startsWith("⭐") || t.startsWith("★")) return false;
    // Emoji médaille seule = rang, pas badge (comparaison string car multi-byte)
    if (RANK_EMOJIS.includes(t)) return false;
    // Contient une URL = pas un badge
    if (t.includes("(https://") || t.includes("(http://")) return false;
    return true;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!isBadge(line)) {
      i++;
      continue;
    }

    const badgeText = line;
    const isWinner = badgeText.includes("GAGNANT");
    i++;

    // Image
    while (i < lines.length && lines[i].trim() === "") i++;
    let image = "";
    let imageAlt = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (m) { imageAlt = m[1]; image = m[2]; i++; }
    }

    // Rang (emoji médaille seule — comparaison string car multi-byte)
    while (i < lines.length && lines[i].trim() === "") i++;
    let rank = "";
    if (i < lines.length && RANK_EMOJIS.includes(lines[i].trim())) {
      rank = lines[i].trim();
      i++;
    }

    // Nom + href  (### [nom](href))
    while (i < lines.length && lines[i].trim() === "") i++;
    let name = "";
    let href = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^###\s+\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) { name = m[1]; href = m[2]; i++; }
    }

    // Specs
    while (i < lines.length && lines[i].trim() === "") i++;
    let rating = "";
    let price = "";
    let extra = "";
    if (i < lines.length && /[★☆]|€/.test(lines[i].trim())) {
      const p = parseSpecs(lines[i].trim());
      rating = p.rating; price = p.price; extra = p.extra;
      i++;
    }

    // Avis
    while (i < lines.length && lines[i].trim() === "") i++;
    let review = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^\*\*Mon avis\s*:\*\*\s*(.+)$/);
      if (m) { review = m[1].trim(); i++; }
    }

    // Tags
    while (i < lines.length && lines[i].trim() === "") i++;
    let tags = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^✨\s*Parfait pour\s*:\s*(.+)$/);
      if (m) { tags = m[1].trim(); i++; }
    }

    // CTA
    while (i < lines.length && lines[i].trim() === "") i++;
    let ctaLabel = "";
    let ctaHref = "";
    if (i < lines.length) {
      const m = lines[i].trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) { ctaLabel = m[1]; ctaHref = m[2]; i++; }
    }

    const finalHref = ctaHref || href;
    if (name && finalHref) {
      cards.push({
        isWinner,
        badgeText,
        rank,
        image,
        imageAlt,
        name,
        href: finalHref,
        rating,
        price,
        extra,
        review,
        tags,
        ctaLabel: ctaLabel || (isWinner ? "Je teste le gagnant ! 🏆" : "Découvrir →"),
      });
    }
  }

  return cards;
}

/**
 * Génère le JSX ComparisonTable + ProductCard(s).
 */
function buildCardsJsx(tableTitle, cards) {
  if (cards.length === 0) return null;

  const cardJsx = cards.map((c) => {
    const attrs = [];
    if (c.isWinner) {
      attrs.push("  winner");
    } else {
      const variant = badgeVariant(c.badgeText);
      attrs.push(
        `  badge={{ label: "${escapeJsx(c.badgeText)}", variant: "${variant}" }}`
      );
    }
    if (c.rank) attrs.push(`  rank="${escapeJsx(c.rank)}"`);
    if (c.image) attrs.push(`  image="${escapeJsx(c.image)}"`);
    if (c.imageAlt) attrs.push(`  imageAlt="${escapeJsx(c.imageAlt)}"`);
    attrs.push(`  name="${escapeJsx(c.name)}"`);
    attrs.push(`  href="${escapeJsx(c.href)}"`);
    if (c.rating) attrs.push(`  rating="${escapeJsx(c.rating)}"`);
    if (c.price) attrs.push(`  price="${escapeJsx(c.price)}"`);
    if (c.extra) attrs.push(`  extra="${escapeJsx(c.extra)}"`);
    if (c.review) attrs.push(`  review="${escapeJsx(c.review)}"`);
    if (c.tags) attrs.push(`  tags="${escapeJsx(c.tags)}"`);
    attrs.push(`  ctaLabel="${escapeJsx(c.ctaLabel)}"`);
    return `<ProductCard\n${attrs.join("\n")}\n/>`;
  });

  return [
    `<ComparisonTable`,
    `  title="${escapeJsx(tableTitle)}"`,
    `  anchorId="tableau-comparatif"`,
    `>`,
    ``,
    ...cardJsx.flatMap((j) => [j, ""]),
    `</ComparisonTable>`,
  ].join("\n");
}

/**
 * Localise le bloc Greenweez dans les lignes du corps.
 * Marqueur début : ligne "✨ PARTENAIRE" (pas "✨ Parfait pour").
 * Marqueur fin : après le lien CTA ([…](…)) du bloc, avant la prochaine
 *   section (### FAQ ou ### Conclusion ou ## …).
 *
 * ⚠️ Le titre Greenweez "### Fini la galère…" EST dans le bloc → on ne peut
 *   pas s'arrêter au premier ###. On cherche la ligne CTA [Je découvre →](href)
 *   puis on continue jusqu'à la prochaine ligne vide + heading.
 */
function findGreenweezBlock(lines) {
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "✨ PARTENAIRE") {
      // Chercher la ligne CTA affiliée à l'intérieur du bloc
      // Pattern : [texte](https://c3po.link/…)
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        const tl = lines[j].trim();
        if (/^\[.+\]\(https?:\/\//.test(tl)) {
          // Le bloc finit après cette ligne (+ lignes vides éventuelles)
          let k = j + 1;
          while (k < lines.length && lines[k].trim() === "") k++;
          end = k;
          break;
        }
      }
      return { gwStart: i, gwEnd: end };
    }
  }
  return null;
}

/**
 * Parse le bloc Greenweez depuis ses lignes.
 * Structure (dans l'ordre après "✨ PARTENAIRE") :
 *   ![Greenweez](logo-url)
 *   GREENWEEZ
 *   ### <titre>
 *   <description>
 *   ✓ spec1
 *   ✓ spec2
 *   ✓ spec3
 *   ✓ spec4
 *   🚚 Livraison OFFERTE
 *   [Je découvre →](href)
 */
function parseGreenweez(lines) {
  let i = 0;

  // Sauter la ligne "✨ PARTENAIRE" (1re ligne des lignes passées en arg)
  if (lines[i] && lines[i].trim() === "✨ PARTENAIRE") i++;

  // Logo
  while (i < lines.length && lines[i].trim() === "") i++;
  let logo = "";
  if (i < lines.length) {
    const m = lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (m) { logo = m[2]; i++; }
  }

  // Brand (ex : "GREENWEEZ")
  while (i < lines.length && lines[i].trim() === "") i++;
  let brand = "GREENWEEZ";
  if (i < lines.length) {
    const t = lines[i].trim();
    if (t && !t.startsWith("#") && !t.startsWith("✓") && !t.startsWith("🚚")) {
      brand = t;
      i++;
    }
  }

  // Titre (### …)
  while (i < lines.length && lines[i].trim() === "") i++;
  let titleRaw = "";
  if (i < lines.length) {
    const m = lines[i].trim().match(/^###\s+(.+)$/);
    if (m) { titleRaw = m[1]; i++; }
  }

  // Description (paragraphe avant ✓)
  while (i < lines.length && lines[i].trim() === "") i++;
  const descLines = [];
  while (i < lines.length && !lines[i].trim().startsWith("✓") && lines[i].trim() !== "") {
    descLines.push(lines[i].trim());
    i++;
  }
  // Supprimer les bold markdown (**text** → text)
  const description = descLines.join(" ").replace(/\*\*([^*]+)\*\*/g, "$1").trim();

  // Specs ✓
  const specs = [];
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith("✓")) {
      specs.push(t.replace(/^✓\s*/, "").trim());
      i++;
    } else if (t === "") {
      i++;
    } else {
      break;
    }
  }

  // Promo pill (🚚 …)
  while (i < lines.length && lines[i].trim() === "") i++;
  let promo = "";
  if (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith("🚚") || /offerte/i.test(t)) {
      promo = t;
      i++;
    }
  }

  // CTA ([label](href))
  while (i < lines.length && lines[i].trim() === "") i++;
  let ctaLabel = "Je découvre →";
  let href = "";
  if (i < lines.length) {
    const m = lines[i].trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) { ctaLabel = m[1]; href = m[2]; }
  }

  // Découper le titre pour l'accent olive sur un mot-clé
  // Pattern connu : "Fini la galère des <mot> ! 🛒"
  let titleBefore = "";
  let titleAccent = "";
  let titleAfter = "";
  if (titleRaw) {
    const accentMatch = titleRaw.match(/^(.+\bdes\s+)(\S+?)(\s*[!🛒].*)$/u);
    if (accentMatch) {
      titleBefore = accentMatch[1];
      titleAccent = accentMatch[2];
      titleAfter = accentMatch[3];
    } else {
      titleBefore = titleRaw;
    }
  }

  return { logo, brand, titleBefore, titleAccent, titleAfter, titleFull: titleBefore, description, specs, promo, ctaLabel, href };
}

/**
 * Génère le JSX GreenweezCta.
 */
function buildGreenweezJsx(gw) {
  const attrs = [];
  if (gw.logo) attrs.push(`  logo="${escapeJsx(gw.logo)}"`);
  attrs.push(`  brand="${escapeJsx(gw.brand)}"`);
  if (gw.titleAccent) {
    attrs.push(`  titleBefore="${escapeJsx(gw.titleBefore)}"`);
    attrs.push(`  titleAccent="${escapeJsx(gw.titleAccent)}"`);
    attrs.push(`  titleAfter="${escapeJsx(gw.titleAfter)}"`);
  } else if (gw.titleFull) {
    attrs.push(`  title="${escapeJsx(gw.titleFull)}"`);
  }
  if (gw.description) attrs.push(`  description="${escapeJsx(gw.description)}"`);
  if (gw.specs.length > 0) attrs.push(`  specs={${JSON.stringify(gw.specs)}}`);
  if (gw.promo) attrs.push(`  promo="${escapeJsx(gw.promo)}"`);
  attrs.push(`  ctaLabel="${escapeJsx(gw.ctaLabel)}"`);
  attrs.push(`  href="${escapeJsx(gw.href)}"`);
  return `<GreenweezCta\n${attrs.join("\n")}\n/>`;
}

/**
 * Localise et parse la section FAQ du corps (### FAQ : … + Q/R plats).
 */
function parseFaq(lines) {
  const faqIdx = lines.findIndex((l) => /^###\s+FAQ\s*[:\-–]/i.test(l.trim()));
  if (faqIdx === -1) return null;

  const items = [];
  let i = faqIdx + 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    // Fin : nouveau heading
    if (/^#{2,3}\s/.test(line) && !/FAQ/i.test(line)) break;
    // Question : ligne non-vide, non-heading, non-liste, non-avis
    if (
      line.length > 10 &&
      !line.startsWith("#") &&
      !line.startsWith("*") &&
      !line.startsWith("-") &&
      !line.startsWith("✨") &&
      !line.startsWith(">")
    ) {
      const question = line;
      i++;
      while (i < lines.length && lines[i].trim() === "") i++;
      const ansLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^#{2,}/.test(lines[i].trim())) {
        ansLines.push(lines[i].trim());
        i++;
      }
      const answer = ansLines.join(" ").trim();
      if (question && answer) items.push({ q: question, a: answer });
    } else {
      i++;
    }
  }

  if (items.length === 0) return null;
  return { items, startIndex: faqIdx, endIndex: i };
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion principale d'un fichier MDX
// ─────────────────────────────────────────────────────────────────────────────

function convertFile(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`❌ Fichier introuvable : ${absPath}`);
    return false;
  }

  const original = readFileSync(absPath, "utf8");
  const content = original.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Séparer frontmatter et corps
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`❌ Pas de frontmatter YAML dans : ${absPath}`);
    return false;
  }
  let frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // ── Étape 1 : Supprimer les titres techniques fuités ──
  // \s* en tête/queue pour capturer les lignes avec espaces de début (ex: " Greenweez CTA – …")
  // \s* autour du tiret cadratin (–, U+2013) ou tiret simple pour les deux variantes
  body = body.replace(/^\s*Comparatif .+\s*[–-]\s*Design Mobile First\s*$/gm, "");
  body = body.replace(/^\s*Greenweez CTA\s*[–-]\s*Harmonie Design\s*$/gm, "");

  const bodyLines = body.split("\n");

  // ── Étape 2 : Localiser les blocs ──
  const cardsBlock = findCardsBlock(bodyLines);
  const gwBlock = findGreenweezBlock(bodyLines);
  const faqResult = parseFaq(bodyLines);

  // ── Étape 3 : Parser les blocs ──
  let cardsJsx = null;
  if (cardsBlock) {
    const cardsLines = bodyLines.slice(cardsBlock.cardsStart + 1, cardsBlock.cardsEnd);
    const cards = parseCards(cardsLines);
    cardsJsx = buildCardsJsx(
      cardsBlock.titleLine.replace(/^###\s+/, ""),
      cards
    );
    if (cards.length === 0) {
      console.warn("   ⚠️  Bloc cartes trouvé mais 0 carte parsée");
      cardsJsx = null;
    }
  }

  let gwJsx = null;
  if (gwBlock) {
    const gwLines = bodyLines.slice(gwBlock.gwStart, gwBlock.gwEnd);
    const gw = parseGreenweez(gwLines);
    gwJsx = buildGreenweezJsx(gw);
  }

  // ── Étape 4 : Reconstruire le corps (remplacement de bas en haut) ──
  // Construire la liste des sections à remplacer, triées par position décroissante
  const replacements = [];
  if (cardsBlock && cardsJsx) {
    replacements.push({
      start: cardsBlock.cardsStart,
      end: cardsBlock.cardsEnd,
      jsx: cardsJsx,
    });
  }
  if (gwBlock && gwJsx) {
    replacements.push({
      start: gwBlock.gwStart,
      end: gwBlock.gwEnd,
      jsx: gwJsx,
    });
  }
  if (faqResult) {
    replacements.push({
      start: faqResult.startIndex,
      end: faqResult.endIndex,
      jsx: null, // supprimer du corps
    });
  }

  // Trier par position décroissante pour ne pas décaler les indices
  replacements.sort((a, b) => b.start - a.start);

  let newLines = [...bodyLines];
  for (const rep of replacements) {
    const replacement = rep.jsx !== null ? ["", rep.jsx, ""] : [];
    newLines.splice(rep.start, rep.end - rep.start, ...replacement);
  }

  let newBody = newLines.join("\n");
  // Nettoyer les lignes vides > 3 consécutives
  newBody = newBody.replace(/\n{4,}/g, "\n\n\n");

  // ── Étape 5 : Migrer la FAQ vers le frontmatter ──
  if (faqResult && faqResult.items.length > 0 && !frontmatter.includes("\nfaq:")) {
    const faqYaml = faqResult.items
      .map(
        (item) =>
          `  - q: '${escapeYaml(item.q)}'\n    a: '${escapeYaml(item.a)}'`
      )
      .join("\n");
    frontmatter = frontmatter.replace(/\n---\n$/, `\nfaq:\n${faqYaml}\n---\n`);
  }

  const newContent = frontmatter + newBody;

  // ── Rapport ──
  console.log(`\n📄 ${filePath}`);
  if (cardsJsx) {
    const n = (cardsJsx.match(/<ProductCard/g) || []).length;
    const winnerCount = (cardsJsx.match(/\bwinner\b/g) || []).length;
    console.log(`   ✅ ${n} carte(s) (dont ${winnerCount} gagnant) → <ComparisonTable>`);
  } else {
    console.log("   ⚠️  Bloc cartes non trouvé ou non parsé");
  }
  if (gwJsx) {
    console.log("   ✅ Bloc Greenweez → <GreenweezCta>");
  } else {
    console.log("   ⚠️  Bloc Greenweez non trouvé ou non parsé");
  }
  if (faqResult) {
    console.log(`   ✅ FAQ migrée vers frontmatter (${faqResult.items.length} Q/R)`);
  } else {
    console.log("   ℹ️  Pas de FAQ détectée dans le corps");
  }

  if (dryRun) {
    // Afficher la zone clé (autour des blocs)
    const allLines = newContent.split("\n");
    // Trouver ComparisonTable
    const ctIdx = allLines.findIndex((l) => l.includes("<ComparisonTable"));
    const gwIdx = allLines.findIndex((l) => l.includes("<GreenweezCta"));
    console.log("\n   ── Aperçu ComparisonTable ──");
    if (ctIdx !== -1) console.log(allLines.slice(ctIdx, ctIdx + 30).join("\n"));
    console.log("\n   ── Aperçu GreenweezCta ──");
    if (gwIdx !== -1) console.log(allLines.slice(gwIdx, gwIdx + 15).join("\n"));
    // Afficher frontmatter faq si migré
    if (faqResult) {
      const faqFmIdx = frontmatter.indexOf("\nfaq:");
      if (faqFmIdx !== -1) {
        console.log("\n   ── Frontmatter FAQ ──");
        console.log(frontmatter.slice(faqFmIdx, faqFmIdx + 400));
      }
    }
    return true;
  }

  // Backup + écriture
  const backupPath = absPath + ".orig";
  if (!existsSync(backupPath)) {
    writeFileSync(backupPath, original, "utf8");
  }
  writeFileSync(absPath, newContent, "utf8");
  console.log(`   💾 Écrit (backup : ${backupPath.split("/").pop()})`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n🌱 convert-guide-blocks.mjs — ${dryRun ? "MODE DRY-RUN" : "ÉCRITURE"}`);
console.log(`   Fichiers : ${files.length}`);

let ok = 0;
let ko = 0;
for (const f of files) {
  const success = convertFile(f);
  if (success) ok++;
  else ko++;
}

console.log(`\n✅ ${ok} fichier(s) traité(s) avec succès, ❌ ${ko} erreur(s)\n`);
if (ko > 0) process.exit(1);
