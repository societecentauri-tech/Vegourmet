// scripts/migrate-content-images.mjs
// Migre toutes les images in-content encore hébergées sur vegourmet.fr vers le
// bucket S3 `veg` (public-read), puis réécrit les URLs dans les MDX.
// 404 (variantes redimensionnées renommées) -> retente l'URL sans suffixe -WxH.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DIRS = ["content/recettes", "content/blog"].map((d) => path.join(ROOT, d));
const DL = path.join(ROOT, ".tmp-content");
const URLMAP = path.join(ROOT, ".data", "content-img-map.json");
const S3_BASE = "https://veg.s3.fr-par.scw.cloud";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";

fs.mkdirSync(DL, { recursive: true });

// 1. Collecte des URLs distinctes vegourmet.fr/wp-content/uploads
const files = DIRS.flatMap((dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => path.join(dir, f)) : [],
);
const urlSet = new Set();
const RE = /https:\/\/vegourmet\.fr\/wp-content\/uploads\/[^)\s"]+\.(?:jpg|jpeg|png|webp|gif)/gi;
for (const f of files) {
  const body = fs.readFileSync(f, "utf-8");
  for (const m of body.matchAll(RE)) urlSet.add(m[0]);
}
const urls = [...urlSet];
console.log(`URLs vegourmet.fr à migrer: ${urls.length}`);

const extOf = (u) => {
  const m = u.split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
};
const keyFor = (u) => crypto.createHash("sha1").update(u).digest("hex").slice(0, 16) + "." + extOf(u);

async function fetchBin(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (res.status === 200) {
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 1024 ? buf : null;
    }
  } catch {
    /* noop */
  }
  return null;
}

// 2. Téléchargement (concurrence) avec fallback de-sized
const urlMap = fs.existsSync(URLMAP) ? JSON.parse(fs.readFileSync(URLMAP, "utf-8")) : {};
const failed = [];
let done = 0;

async function worker(list) {
  for (const url of list) {
    if (urlMap[url]) { done++; continue; }
    const key = keyFor(url);
    const local = path.join(DL, key);
    let buf = await fetchBin(url);
    if (!buf) {
      // retente sans suffixe -1024x576 avant l'extension
      const desized = url.replace(/-\d+x\d+(\.\w+)$/i, "$1");
      if (desized !== url) buf = await fetchBin(desized);
    }
    if (buf) {
      fs.writeFileSync(local, buf);
      urlMap[url] = `${S3_BASE}/img/${key}`;
    } else {
      failed.push(url);
    }
    if (++done % 50 === 0) {
      fs.writeFileSync(URLMAP, JSON.stringify(urlMap, null, 2));
      console.log(`  ... ${done}/${urls.length}`);
    }
  }
}

const CONC = 10;
const chunks = Array.from({ length: CONC }, (_v, i) => urls.filter((_u, idx) => idx % CONC === i));
await Promise.all(chunks.map(worker));
fs.writeFileSync(URLMAP, JSON.stringify(urlMap, null, 2));
console.log(`Téléchargées=${Object.keys(urlMap).length} Échecs(404)=${failed.length}`);

// 3. Upload du dossier en une passe (rclone parallèle), public-read
if (fs.readdirSync(DL).length) {
  console.log("Upload S3 (rclone copy)...");
  execFileSync("rclone", ["copy", DL, "scaleway:veg/img", "--s3-acl", "public-read", "--transfers", "16"], {
    stdio: "inherit",
  });
}

// 4. Réécriture des MDX
let patched = 0;
for (const f of files) {
  let body = fs.readFileSync(f, "utf-8");
  const before = body;
  for (const [orig, s3] of Object.entries(urlMap)) {
    if (body.includes(orig)) body = body.split(orig).join(s3);
  }
  if (body !== before) {
    fs.writeFileSync(f, body, "utf-8");
    patched++;
  }
}
console.log(`MDX réécrits: ${patched}`);
if (failed.length) {
  fs.writeFileSync(path.join(ROOT, ".data", "content-img-failed.json"), JSON.stringify(failed, null, 2));
  console.log(`URLs en échec (404, conservées) listées dans .data/content-img-failed.json`);
}
