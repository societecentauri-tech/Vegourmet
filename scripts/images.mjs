// scripts/images.mjs
// Migration des images du site racheté vers le bucket Scaleway `veg` (public-read),
// puis réécriture des src dans les MDX (heroImage.src + images in-content).
//
// - dédoublonne par URL source
// - télécharge (curl), fallback og:image déjà géré en amont par extract
// - upload rclone scaleway:veg/img/<sha1>.<ext> en public-read
// - écrit .data/image-url-map.json (originalUrl -> URL publique S3)
// - patche tous les MDX (frontmatter heroImage.src + corps markdown)

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, execFileSync } from "node:child_process";
import matter from "gray-matter";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, ".data", "images-manifest.json");
const URLMAP = path.join(ROOT, ".data", "image-url-map.json");
const DL = path.join(ROOT, ".images-dl");
const RECIPES_DIR = path.join(ROOT, "content", "recettes");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const S3_BASE = "https://veg.s3.fr-par.scw.cloud";
const S3_PREFIX = "img";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

fs.mkdirSync(DL, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
const uniqueUrls = [...new Set(manifest.map((m) => m.originalUrl).filter(Boolean))];
console.log(`Images uniques à migrer: ${uniqueUrls.length}`);

function extOf(url) {
  const m = url.split("?")[0].match(/\.(jpe?g|png|webp|gif|avif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}
function keyFor(url) {
  const h = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
  return `${h}.${extOf(url)}`;
}

const urlMap = fs.existsSync(URLMAP) ? JSON.parse(fs.readFileSync(URLMAP, "utf-8")) : {};
let dl = 0, up = 0, fail = 0, skip = 0;

for (const url of uniqueUrls) {
  if (urlMap[url]) { skip++; continue; }
  const key = keyFor(url);
  const local = path.join(DL, key);
  try {
    // download
    execFileSync("curl", ["-fsSL", "-A", UA, "-o", local, url], { stdio: "pipe", timeout: 30000 });
    if (!fs.existsSync(local) || fs.statSync(local).size < 1024) { fail++; continue; }
    dl++;
    // upload public-read
    execFileSync(
      "rclone",
      ["copyto", local, `scaleway:veg/${S3_PREFIX}/${key}`, "--s3-acl", "public-read", "--no-traverse"],
      { stdio: "pipe", timeout: 60000 },
    );
    up++;
    urlMap[url] = `${S3_BASE}/${S3_PREFIX}/${key}`;
    if ((dl) % 25 === 0) {
      fs.writeFileSync(URLMAP, JSON.stringify(urlMap, null, 2));
      console.log(`  ... ${dl} téléchargées, ${up} uploadées`);
    }
  } catch {
    fail++;
  }
}
fs.writeFileSync(URLMAP, JSON.stringify(urlMap, null, 2));
console.log(`Téléchargées=${dl} Uploadées=${up} Échecs=${fail} DéjàFait=${skip}`);

// ---- Patch des MDX : heroImage.src + URLs in-content ----
function patchDir(dir) {
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const full = path.join(dir, file);
    const parsed = matter(fs.readFileSync(full, "utf-8"));
    let changed = false;
    // hero
    const heroOrig = parsed.data?.heroImage?.originalUrl;
    if (heroOrig && urlMap[heroOrig]) {
      if (parsed.data.heroImage.src !== urlMap[heroOrig]) {
        parsed.data.heroImage.src = urlMap[heroOrig];
        changed = true;
      }
    }
    // body : remplace toutes les URLs sources connues
    let body = parsed.content;
    for (const [orig, s3] of Object.entries(urlMap)) {
      if (body.includes(orig)) {
        body = body.split(orig).join(s3);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(full, matter.stringify(body, parsed.data), "utf-8");
      n++;
    }
  }
  return n;
}
const pr = patchDir(RECIPES_DIR);
const pb = patchDir(BLOG_DIR);
console.log(`MDX patchés: recettes=${pr} blog=${pb}`);
console.log("url-map:", URLMAP);
