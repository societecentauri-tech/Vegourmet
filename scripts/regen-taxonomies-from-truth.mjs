// scripts/regen-taxonomies-from-truth.mjs
// Régénère le champ `taxonomies` des recettes MDX depuis la vérité terrain WP.
//
// Source de vérité : /tmp/taxo-truth.json (crawl API REST WordPress, listes
// terme -> [slugs de recettes]). On inverse ce mapping en slug -> {kind -> [termes]}
// puis on réécrit UNIQUEMENT le champ `taxonomies` de chaque recette.
//
// Corrige d'un coup :
//   - les 21 « fourre-tout » (recettes assignées à tous les termes par erreur),
//   - les 16 styles manquants (recettes sans leur vrai style),
//   - en préservant le reste du frontmatter (on ne touche QUE `taxonomies`).
//
// `category` côté recette reste TOUJOURS [] (les catégories ne concernent que les
// articles, via `categorySlug`). C'est conforme au schéma WP : les 4 taxonomies
// recette WP sont recipe-course / recipe-cuisine / recipe-key, la `category` WP
// ne taggue que des posts (articles), jamais des recettes.
//
// Idempotent : relancer le script ne change rien si tout est déjà conforme.
// Dry-run par défaut. Passer --write pour appliquer.
//
//   node scripts/regen-taxonomies-from-truth.mjs            # dry-run
//   node scripts/regen-taxonomies-from-truth.mjs --write    # applique

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const RECIPES_DIR = path.join(ROOT, "content", "recettes");
const TRUTH = process.env.TAXO_TRUTH || "/tmp/taxo-truth.json";
const WRITE = process.argv.includes("--write");

// Les 3 taxonomies de recette gérées (l'ordre est figé pour un diff stable).
const RECIPE_KINDS = ["recette-type", "recette-style", "recette-thematique"];

function loadTruth() {
  if (!fs.existsSync(TRUTH)) {
    console.error(`✗ Fichier de vérité introuvable : ${TRUTH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(TRUTH, "utf-8"));
}

/** Inverse term -> [slugs] en slug -> { kind: Set(termes) } pour les 3 taxos recette. */
function buildInverse(truth) {
  /** @type {Record<string, Record<string, Set<string>>>} */
  const inv = {};
  for (const kind of RECIPE_KINDS) {
    const byTerm = truth[kind] || {};
    for (const [term, slugs] of Object.entries(byTerm)) {
      // Ignore les termes WP à count 0 (listes vides).
      if (!Array.isArray(slugs) || slugs.length === 0) continue;
      for (const slug of slugs) {
        inv[slug] = inv[slug] || {};
        inv[slug][kind] = inv[slug][kind] || new Set();
        inv[slug][kind].add(term);
      }
    }
  }
  return inv;
}

/** Termes triés dans l'ordre d'apparition du truth (= date desc côté WP), dédupliqués. */
function orderedTerms(truth, kind, wanted) {
  const order = Object.keys(truth[kind] || {});
  return order.filter((t) => wanted.has(t));
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function run() {
  const truth = loadTruth();
  const inv = buildInverse(truth);

  const files = fs
    .readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort();

  let changed = 0;
  let orphans = 0;
  const changes = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    const full = path.join(RECIPES_DIR, file);
    const raw = fs.readFileSync(full, "utf-8");
    const parsed = matter(raw);

    const wantedByKind = inv[slug] || {};
    const next = {};
    let hasAny = false;
    for (const kind of RECIPE_KINDS) {
      const terms = orderedTerms(truth, kind, wantedByKind[kind] || new Set());
      next[kind] = terms;
      if (terms.length) hasAny = true;
    }
    // Préserve `category` côté recette (toujours [] dans nos données).
    const prevCategory = Array.isArray(parsed.data.taxonomies?.category)
      ? parsed.data.taxonomies.category
      : [];
    next.category = prevCategory;

    if (!hasAny) orphans++;

    // Diff lisible avant/après (uniquement les 3 taxos recette).
    const before = parsed.data.taxonomies || {};
    let diff = false;
    for (const kind of RECIPE_KINDS) {
      const b = Array.isArray(before[kind]) ? before[kind] : [];
      if (!arraysEqual(b, next[kind])) diff = true;
    }

    if (diff) {
      changed++;
      changes.push({ slug, before, after: next });
    }

    parsed.data.taxonomies = next;

    if (WRITE && diff) {
      // matter.stringify réécrit tout le frontmatter ; comme on ne modifie que
      // `taxonomies`, le reste reste byte-identique au parsing gray-matter.
      fs.writeFileSync(full, matter.stringify(parsed.content, parsed.data), "utf-8");
    }
  }

  // Comptes par terme après régénération (= ce que les pages d'archive rendront).
  const counts = {};
  for (const kind of RECIPE_KINDS) {
    counts[kind] = {};
    for (const term of Object.keys(truth[kind] || {})) {
      const slugs = truth[kind][term] || [];
      if (slugs.length === 0) continue;
      counts[kind][term] = slugs.length;
    }
  }

  console.log(`Mode      : ${WRITE ? "WRITE (appliqué)" : "DRY-RUN (aucune écriture)"}`);
  console.log(`Recettes  : ${files.length} | modifiées : ${changed} | orphelines : ${orphans}`);
  console.log("");
  console.log("Comptes par terme (vérité WP) :");
  for (const kind of RECIPE_KINDS) {
    const entries = Object.entries(counts[kind]).sort((a, b) => b[1] - a[1]);
    console.log(`  ${kind}:`);
    for (const [term, n] of entries) console.log(`    ${term} = ${n}`);
  }

  if (changes.length) {
    console.log("");
    console.log(`Exemples de changements (${Math.min(5, changes.length)} / ${changes.length}) :`);
    for (const c of changes.slice(0, 5)) {
      console.log(`  • ${c.slug}`);
      for (const kind of RECIPE_KINDS) {
        const b = Array.isArray(c.before[kind]) ? c.before[kind] : [];
        const a = c.after[kind];
        if (!arraysEqual(b, a)) {
          console.log(`      ${kind}: [${b.join(", ")}]  →  [${a.join(", ")}]`);
        }
      }
    }
  }
}

run();
