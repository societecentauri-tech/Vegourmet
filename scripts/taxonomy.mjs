// scripts/taxonomy.mjs
//
// ⚠️ SUPERSÉDÉ par scripts/regen-taxonomies-from-truth.mjs (régénère le champ
// `taxonomies` depuis la vérité terrain WP /tmp/taxo-truth.json, dérivée de
// l'API REST WordPress — source fiable et ordonnée). Garder ce script comme
// outil de re-crawl HTML d'appoint uniquement (ré-extraction des pages d'archive
// si l'API REST est indisponible).
//
// Post-mortem : la version originale extrayait TOUS les liens `a[href*="/recettes/"]`
// d'une page d'archive, y compris ceux présents dans le CORPS d'un article
// (« recettes liées », blocs éditoriaux). D'où 21 recettes « fourre-tout »
// assignées à toutes les taxonomies. Le sélecteur ci-dessous est désormais SCOPÉ
// à la grille de cartes de l'archive (titres de cartes), ce qui évite la
// re-pollution future.
//
// Source autoritative des appartenances taxonomiques : les pages d'archive WP
// (/recette-type/X, /recette-style/X, /recette-thematique/X, /category/X) listent
// les recettes qui en font partie. On les fetch (avec pagination), on extrait les
// slugs de recettes liées, et on injecte des champs taxo propres dans le frontmatter.
//
// Sortie : .data/taxonomy-map.json + patch des MDX recettes.

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import matter from "gray-matter";

const ROOT = process.cwd();
const RECIPES_DIR = path.join(ROOT, "content", "recettes");
const WORKLIST = path.join(ROOT, ".data", "worklist.tsv");
const OUT = path.join(ROOT, ".data", "taxonomy-map.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" },
        redirect: "follow",
      });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
      await sleep(700 * (i + 1));
    } catch {
      await sleep(700 * (i + 1));
    }
  }
  return null;
}

function recipeSlugsFrom($) {
  const slugs = new Set();
  // SCOPE à la grille de cartes de l'archive : on ne prend QUE les liens des
  // titres / vignettes de cartes (`.entry-title a`, `.post-thumbnail a`,
  // `article a`), JAMAIS les liens « recettes liées » présents dans le corps
  // d'un article (`.entry-content a`). Cf. post-mortem en tête de fichier.
  const CARD_SELECTORS = [
    "h2.entry-title a",
    ".entry-title a",
    ".post-thumbnail a",
    "article .post-thumbnail a",
  ].join(", ");
  let $cards = $(CARD_SELECTORS).filter('[href*="/recettes/"]');
  // Repli prudent : si le thème ne porte pas ces classes, on retombe sur les
  // liens d'<article> en EXCLUANT explicitement le corps éditorial.
  if ($cards.length === 0) {
    $cards = $('article a[href*="/recettes/"]').filter(
      (_i, el) => $(el).closest(".entry-content").length === 0,
    );
  }
  $cards.each((_i, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/\/recettes\/([^/?#]+)\/?(?:[?#]|$)/);
    if (m && m[1] && m[1] !== "") slugs.add(m[1]);
  });
  return [...slugs];
}

// Liste des archives taxo depuis la worklist
function taxoUrls() {
  const lines = fs.readFileSync(WORKLIST, "utf-8").split("\n").filter(Boolean);
  return lines
    .map((l) => l.split("\t")[0])
    .filter((u) => /\/(recette-type|recette-style|recette-thematique|category)\/[^/]+$/.test(u));
}

function kindAndSlug(url) {
  const m = url.match(/\/(recette-type|recette-style|recette-thematique|category)\/([^/]+)\/?$/);
  return { kind: m[1], slug: m[2] };
}

async function run() {
  const urls = taxoUrls();
  // recipeSlug -> { 'recette-type': Set, 'recette-style': Set, ... }
  const map = {};
  // kind -> slug -> label
  const labels = {};

  for (const baseUrl of urls) {
    const { kind, slug } = kindAndSlug(baseUrl);
    labels[kind] = labels[kind] || {};
    let page = 1;
    const seen = new Set();
    const members = new Set();
    while (page <= 20) {
      const url = page === 1 ? baseUrl : `${baseUrl.replace(/\/$/, "")}/page/${page}/`;
      const html = await fetchHtml(url);
      if (!html) break;
      const $ = cheerio.load(html);
      if (page === 1) {
        const label =
          ($("h1").first().text() || "").replace(/\s+/g, " ").trim() ||
          slug.replace(/-/g, " ");
        labels[kind][slug] = label
          .replace(/^(Type de recette|Style|Thématique|Catégorie)\s*:?\s*/i, "")
          .trim();
      }
      const found = recipeSlugsFrom($);
      const fresh = found.filter((s) => !seen.has(s));
      if (fresh.length === 0) break;
      fresh.forEach((s) => {
        seen.add(s);
        members.add(s);
      });
      page++;
      await sleep(150);
    }
    for (const recipeSlug of members) {
      map[recipeSlug] = map[recipeSlug] || {};
      map[recipeSlug][kind] = map[recipeSlug][kind] || [];
      if (!map[recipeSlug][kind].includes(slug)) map[recipeSlug][kind].push(slug);
    }
    console.log(`${kind}/${slug} -> ${members.size} recettes (label="${labels[kind][slug]}")`);
  }

  fs.writeFileSync(OUT, JSON.stringify({ labels, map }, null, 2));

  // Patch des MDX recettes : champ `taxonomies`
  let patched = 0;
  let orphans = 0;
  for (const file of fs.readdirSync(RECIPES_DIR)) {
    if (!file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.mdx$/, "");
    const full = path.join(RECIPES_DIR, file);
    const parsed = matter(fs.readFileSync(full, "utf-8"));
    const tax = map[slug] || {};
    if (Object.keys(tax).length === 0) orphans++;
    parsed.data.taxonomies = {
      "recette-type": tax["recette-type"] || [],
      "recette-style": tax["recette-style"] || [],
      "recette-thematique": tax["recette-thematique"] || [],
      category: tax["category"] || [],
    };
    fs.writeFileSync(full, matter.stringify(parsed.content, parsed.data), "utf-8");
    patched++;
  }

  const counts = {};
  for (const s of Object.values(map))
    for (const [k, arr] of Object.entries(s))
      counts[k] = (counts[k] || 0) + (arr.length ? 1 : 0);

  console.log(`\nPatchées: ${patched} recettes. Sans aucune taxo: ${orphans}.`);
  console.log("Carte écrite:", OUT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
