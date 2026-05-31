// scripts/extract.mjs
// Moteur d'extraction "reprise de site" — vegourmet.fr (WordPress + thème Yummy Bites
// + plugin WP Delicious) → MDX stack Centauri.
//
// Déterministe et uniforme sur les 199 URLs : un seul parser pour toutes les recettes
// (même template dr-*), un seul pour toutes les pages éditoriales (.entry-content).
// Capture le CORPS COMPLET de chaque page (pas un résumé).
//
// Usage :
//   node scripts/extract.mjs            # tout
//   node scripts/extract.mjs --only=recettes|pages
//   node scripts/extract.mjs --limit=5  # debug
//   node scripts/extract.mjs --url=https://vegourmet.fr/a-propos/   # une page
//
// Sorties :
//   content/recettes/<slug>.mdx
//   content/blog/<slug>.mdx
//   .data/images-manifest.json   (toutes les images rencontrées)
//   .data/extract-report.json    (statut par URL)

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import matter from "gray-matter";

const ROOT = process.cwd();
const WORKLIST = path.join(ROOT, ".data", "worklist.tsv");
const RECIPES_DIR = path.join(ROOT, "content", "recettes");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const MANIFEST = path.join(ROOT, ".data", "images-manifest.json");
const REPORT = path.join(ROOT, ".data", "extract-report.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

// ----------------------------------------------------------------------------
// Turndown (HTML -> Markdown) configuré pour un MDX propre
// ----------------------------------------------------------------------------
const td = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  hr: "---",
});
td.use(gfm);
// Garde les images en markdown, conserve l'alt
td.addRule("img", {
  filter: "img",
  replacement: (_content, node) => {
    const src =
      node.getAttribute("data-src") ||
      node.getAttribute("data-lazy-src") ||
      node.getAttribute("src") ||
      "";
    const alt = (node.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
    if (!src || src.startsWith("data:")) return "";
    return `![${alt}](${src})`;
  },
});
// Supprime totalement les éléments parasites
td.remove(["script", "style", "noscript", "iframe", "form", "button"]);

// ----------------------------------------------------------------------------
// Utilitaires
// ----------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugOf(url) {
  const u = new URL(url);
  const seg = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  return seg.length ? seg[seg.length - 1] : "index";
}

function classify(url) {
  const p = new URL(url).pathname.replace(/\/+$/, "");
  if (p === "" ) return "home";
  if (/^\/recettes$/.test(p)) return "recettes-index";
  if (/^\/recettes\/[^/]+$/.test(p)) return "recette";
  if (/^\/(recette-type|recette-style|recette-thematique|category)\//.test(p))
    return "taxo";
  return "page";
}

async function fetchHtml(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9",
        },
        redirect: "follow",
      });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
      // 403/429/5xx -> backoff
      await sleep(800 * (i + 1));
    } catch {
      await sleep(800 * (i + 1));
    }
  }
  return null;
}

const images = []; // { originalUrl, slug, type, context, alt }
function pushImage(originalUrl, slug, type, context, alt = "") {
  if (!originalUrl || originalUrl.startsWith("data:")) return;
  images.push({ originalUrl, slug, type, context, alt });
}

function clean(t) {
  return (t || "").replace(/\s+/g, " ").trim();
}

// Retire récursivement les clés undefined (YAML ne sait pas les sérialiser)
function pruneUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(pruneUndefined);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      out[k] = pruneUndefined(v);
    }
    return out;
  }
  return obj;
}

// Frontmatter -> MDX (gray-matter gère l'échappement YAML)
function writeMdx(dir, slug, data, body) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.mdx`);
  const out = matter.stringify(`\n${body.trim()}\n`, pruneUndefined(data));
  fs.writeFileSync(file, out, "utf-8");
}

// ----------------------------------------------------------------------------
// Parseur RECETTE (WP Delicious — classes dr-*)
// ----------------------------------------------------------------------------
function parseRecipe($, url, meta) {
  const slug = slugOf(url);

  const title =
    clean($(".dr-recipe-title").first().text()) ||
    clean($("h1").first().text()) ||
    meta.title;

  // Image héro
  const heroOrig =
    meta.ogImage ||
    $(".dr-recipe-fig img, .dr-feat-thumb img").first().attr("data-src") ||
    $(".dr-recipe-fig img, .dr-feat-thumb img").first().attr("src") ||
    "";
  pushImage(heroOrig, slug, "recette", "hero", title);

  // Temps
  const timeText = (sel) =>
    clean($(sel).first().text()).replace(/^[^0-9]*/, "").trim();
  const prepTime = timeText(".dr-prep-time .dr-time, .dr-prep-time");
  const cookTime = timeText(".dr-cook-time .dr-time, .dr-cook-time");
  const totalTime = timeText(".dr-total-time .dr-time, .dr-total-time");

  // Portions
  const servings =
    clean($(".dr-ingredients-scale").first().attr("data-serving-value") || "") ||
    clean($(".dr-serving, .dr-recipe-servings").first().text());

  // Difficulté
  const difficulty = clean($(".dr-recipe-diffic .dr-level, .dr-recipe-diffic").first().text());

  // Ingrédients : items de liste sous .dr-ingredients-list / .recipe-ingredients
  const ingredients = [];
  $(".dr-ingredients-list li, .recipe-ingredients li, .dr-ingredients li").each(
    (_i, el) => {
      const name = clean($(el).text());
      if (name) ingredients.push({ name, quantity: "", unit: "" });
    },
  );

  // Instructions
  const steps = [];
  $(".dr-instructions .dr-instruction, .dr-instructions li, .recipe-instructions li").each(
    (_i, el) => {
      const text = clean($(el).text());
      if (text) steps.push({ text });
    },
  );

  // Nutrition (best-effort)
  const nut = {};
  $(".dr-nutrition li, .dr-recipe-nutrition li").each((_i, el) => {
    const t = clean($(el).text()).toLowerCase();
    const num = (t.match(/([\d.,]+\s*(?:k?cal|g|mg))/) || [])[1] || "";
    if (/calor|énerg|energ/.test(t)) nut.calories = num;
    else if (/protéin|protein/.test(t)) nut.protein = num;
    else if (/glucid|carb/.test(t)) nut.carbs = num;
    else if (/lipid|fat|gras/.test(t)) nut.fat = num;
  });

  // Mots-clés / tags
  const tags = [];
  $(".dr-keywords a, .dr-recipe-keys a, .dr-keywords").each((_i, el) => {
    const t = clean($(el).text());
    if (t && t.length < 40) tags.push(t);
  });

  // Catégorie (fil d'Ariane ou recipe-keys)
  const category =
    clean($(".dr-category a").first().text()) ||
    clean($(".breadcrumb a, .dr-breadcrumb a").eq(1).text()) ||
    "Recettes";

  // FAQ
  const faq = [];
  $(".dr-faq-item").each((_i, el) => {
    const q = clean($(el).find(".dr-faq-title, .dr-faq-title-wrap").first().text());
    const a = clean($(el).find(".dr-faq-content-wrap, .dr-faq-content").first().text());
    if (q && a) faq.push({ q, a });
  });

  // Corps éditorial complet (prose hors carte technique) :
  // .dr-entry-content contient l'intro + le contenu rédactionnel.
  const $body = $(".dr-entry-content").first().clone();
  // retire les blocs techniques/interactifs déjà extraits en structuré
  $body
    .find(
      ".dr-single-recipe, .dr-recipe-share, .dr-recipe-meta, .dr-buttons, " +
        ".dr-print-trigger, .dr-related-recipes, .dr-comments, #comments, " +
        ".dr-star-ratings-wrapper, .dr-form, script, style, ins",
    )
    .remove();
  // images du corps -> manifest
  $body.find("img").each((_i, el) => {
    const s = $(el).attr("data-src") || $(el).attr("src") || "";
    pushImage(s, slug, "recette", "in-content", clean($(el).attr("alt")));
  });
  let body = td.turndown($body.html() || "");
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  if (!body) body = clean(meta.metaDescription);

  const data = {
    title,
    slug,
    description: clean(meta.metaDescription) || clean($(".dr-recipe-summary-inner").first().text()).slice(0, 300),
    datePublished: meta.date || "2025-01-01",
    author: "Chloé",
    prepTime,
    cookTime,
    totalTime,
    servings: String(servings || ""),
    difficulty,
    ingredients,
    steps,
    nutrition: Object.keys(nut).length ? nut : undefined,
    category,
    cuisine: "Vegan",
    tags: [...new Set(tags)].slice(0, 12),
    heroImage: { src: "", originalUrl: heroOrig },
    faq: faq.length ? faq : undefined,
  };

  writeMdx(RECIPES_DIR, slug, data, body);
  return {
    slug,
    ingredients: ingredients.length,
    steps: steps.length,
    bodyChars: body.length,
    images: images.filter((i) => i.slug === slug).length,
  };
}

// ----------------------------------------------------------------------------
// Parseur PAGE éditoriale (article / page statique) — .entry-content COMPLET
// ----------------------------------------------------------------------------
function parsePage($, url, meta) {
  const slug = slugOf(url);
  const title = clean($("h1.entry-title, h1").first().text()) || meta.title;

  const heroOrig =
    meta.ogImage ||
    $(".entry-content img, .post-thumbnail img, article img").first().attr("data-src") ||
    $(".entry-content img, .post-thumbnail img, article img").first().attr("src") ||
    "";
  pushImage(heroOrig, slug, "page", "hero", title);

  const category =
    clean($(".cat-links a, .post-categories a, .dr-category a").first().text()) ||
    "Blog";

  // Corps COMPLET
  const $body = $(".entry-content").first().clone();
  $body
    .find(
      ".sharedaddy, .jp-relatedposts, .dr-related-recipes, #comments, " +
        ".comments-area, .post-navigation, .author-bio, .newsletter, " +
        ".dr-recipe-share, .dr-buttons, script, style, ins, .ad, .adsbygoogle",
    )
    .remove();
  $body.find("img").each((_i, el) => {
    const s = $(el).attr("data-src") || $(el).attr("src") || "";
    pushImage(s, slug, "page", "in-content", clean($(el).attr("alt")));
  });

  // FAQ éventuelle (blocs accordéon)
  const faq = [];
  $(".dr-faq-item, .schema-faq-section .schema-faq-question").each((_i, el) => {
    const q = clean($(el).find(".dr-faq-title").first().text()) || clean($(el).text());
    const a = clean($(el).next(".schema-faq-answer").text()) || clean($(el).find(".dr-faq-content-wrap").text());
    if (q && a) faq.push({ q, a });
  });

  let body = td.turndown($body.html() || "");
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  const data = {
    title,
    slug,
    description: clean(meta.metaDescription),
    datePublished: meta.date || "2025-01-01",
    author: "Chloé",
    tags: [],
    category,
    heroImage: { src: "", originalUrl: heroOrig },
    faq: faq.length ? faq : undefined,
  };

  writeMdx(BLOG_DIR, slug, data, body);
  return { slug, bodyChars: body.length, images: images.filter((i) => i.slug === slug).length };
}

// ----------------------------------------------------------------------------
// Date de publication : <meta property="article:published_time"> ou <time>
// ----------------------------------------------------------------------------
function extractDate($) {
  const m =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time.entry-date, time.published, time[datetime]").first().attr("datetime") ||
    "";
  if (!m) return "";
  const d = new Date(m);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

// ----------------------------------------------------------------------------
// Worklist
// ----------------------------------------------------------------------------
function loadWorklist() {
  const lines = fs.readFileSync(WORKLIST, "utf-8").split("\n").filter(Boolean);
  return lines.map((l) => {
    const [url, title, metaDescription, ogImage, ogTitle] = l.split("\t");
    return { url, title, metaDescription, ogImage, ogTitle };
  });
}

// ----------------------------------------------------------------------------
// Main — pool de concurrence limité (poli avec Cloudflare)
// ----------------------------------------------------------------------------
async function run() {
  let work = loadWorklist();
  if (args.url) work = work.filter((w) => w.url.replace(/\/+$/, "") === String(args.url).replace(/\/+$/, ""));
  if (args.only === "recettes") work = work.filter((w) => classify(w.url) === "recette");
  if (args.only === "pages") work = work.filter((w) => classify(w.url) === "page");
  if (args.limit) work = work.slice(0, Number(args.limit));

  const report = [];
  const CONCURRENCY = 4;
  let idx = 0;

  async function worker(wid) {
    while (idx < work.length) {
      const item = work[idx++];
      const type = classify(item.url);
      if (type === "home" || type === "taxo" || type === "recettes-index") {
        report.push({ url: item.url, type, status: "app-generated" });
        continue;
      }
      const html = await fetchHtml(item.url);
      if (!html) {
        report.push({ url: item.url, type, status: "FETCH_FAIL" });
        continue;
      }
      const $ = cheerio.load(html);
      const meta = {
        title: item.ogTitle || item.title,
        metaDescription: item.metaDescription,
        ogImage: item.ogImage,
        date: extractDate($),
      };
      try {
        const r =
          type === "recette" ? parseRecipe($, item.url, meta) : parsePage($, item.url, meta);
        report.push({ url: item.url, type, status: "OK", ...r });
        process.stdout.write(
          `[${report.length}/${work.length}] ${type} ${r.slug} ` +
            `${type === "recette" ? `ing=${r.ingredients} steps=${r.steps} ` : ""}` +
            `chars=${r.bodyChars} img=${r.images}\n`,
        );
      } catch (e) {
        report.push({ url: item.url, type, status: "PARSE_FAIL", error: String(e).slice(0, 200) });
      }
      await sleep(120); // throttle léger
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_v, i) => worker(i)));

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(images, null, 2));
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  const ok = report.filter((r) => r.status === "OK").length;
  const gen = report.filter((r) => r.status === "app-generated").length;
  const fail = report.filter((r) => /FAIL/.test(r.status)).length;
  console.log(
    `\n=== EXTRACTION TERMINÉE ===\nOK=${ok}  app-generated=${gen}  FAIL=${fail}  ` +
      `images=${images.length}\nmanifest=${MANIFEST}\nreport=${REPORT}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
