// scripts/taxonomy-articles.mjs
// Les 4 archives /category/* listent les ARTICLES de blog (pas les recettes).
// On fetch chaque archive (pagination), on extrait les slugs d'articles racine,
// et on patche le frontmatter `categorySlug` + `category` (label) de chaque article.

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import matter from "gray-matter";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const WORKLIST = path.join(ROOT, ".data", "worklist.tsv");
const MAP = path.join(ROOT, ".data", "taxonomy-map.json");

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

// Ensemble des slugs d'articles connus (fichiers blog existants)
const articleSlugs = new Set(
  fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, "")),
);

function articleLinksFrom($) {
  const slugs = new Set();
  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/^https?:\/\/vegourmet\.fr\/([^/?#]+)\/?(?:[?#]|$)/);
    if (m && articleSlugs.has(m[1])) slugs.add(m[1]);
  });
  return [...slugs];
}

function categoryUrls() {
  const lines = fs.readFileSync(WORKLIST, "utf-8").split("\n").filter(Boolean);
  return lines.map((l) => l.split("\t")[0]).filter((u) => /\/category\/[^/]+$/.test(u));
}

async function run() {
  const taxoData = JSON.parse(fs.readFileSync(MAP, "utf-8"));
  taxoData.labels.category = taxoData.labels.category || {};
  const articleCat = {}; // articleSlug -> categorySlug

  for (const baseUrl of categoryUrls()) {
    const slug = baseUrl.match(/\/category\/([^/]+)\/?$/)[1];
    let page = 1;
    const seen = new Set();
    while (page <= 20) {
      const url = page === 1 ? baseUrl : `${baseUrl.replace(/\/$/, "")}/page/${page}/`;
      const html = await fetchHtml(url);
      if (!html) break;
      const $ = cheerio.load(html);
      if (page === 1) {
        const label = ($("h1").first().text() || "").replace(/\s+/g, " ").trim();
        taxoData.labels.category[slug] = label
          .replace(/^(Catégorie|Category)\s*:?\s*/i, "")
          .trim() || slug.replace(/-/g, " ");
      }
      const found = articleLinksFrom($).filter((s) => !seen.has(s));
      if (found.length === 0) break;
      found.forEach((s) => {
        seen.add(s);
        articleCat[s] = slug;
      });
      page++;
      await sleep(150);
    }
    console.log(`category/${slug} -> ${seen.size} articles (label="${taxoData.labels.category[slug]}")`);
  }

  fs.writeFileSync(MAP, JSON.stringify(taxoData, null, 2));

  // Patch articles
  let patched = 0;
  let orphan = 0;
  for (const file of fs.readdirSync(BLOG_DIR)) {
    if (!file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.mdx$/, "");
    const full = path.join(BLOG_DIR, file);
    const parsed = matter(fs.readFileSync(full, "utf-8"));
    const catSlug = articleCat[slug] || "";
    parsed.data.categorySlug = catSlug;
    if (catSlug) parsed.data.category = taxoData.labels.category[catSlug] || parsed.data.category;
    else orphan++;
    fs.writeFileSync(full, matter.stringify(parsed.content, parsed.data), "utf-8");
    patched++;
  }
  console.log(`\nArticles patchés: ${patched}. Sans catégorie: ${orphan}.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
