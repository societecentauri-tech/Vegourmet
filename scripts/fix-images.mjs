// scripts/fix-images.mjs
// Normalise le markdown image/lien dans tous les MDX :
//  1. Déballe les images auto-liées par WordPress : [![alt](img)](href) -> ![alt](img)
//  2. Convertit les liens-texte vers une image en vraie image : [légende](url.jpg) -> ![légende](url.jpg)
//  3. Supprime le junk plugin (bouton « pinit », assets delicious-recipes)
//
// (La migration des URLs vers S3 est faite ensuite par scripts/migrate-content-images.mjs.)

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DIRS = ["content/recettes", "content/blog"].map((d) => path.join(process.cwd(), d));
const IMG_EXT = "(?:jpg|jpeg|png|webp|gif)";

let unwrapped = 0;
let converted = 0;
let junk = 0;
let filesChanged = 0;

for (const dir of DIRS) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const full = path.join(dir, file);
    const parsed = matter(fs.readFileSync(full, "utf-8"));
    let body = parsed.content;
    const before = body;

    // 3. Junk plugin : ![..](pinit) / [..](delicious-recipes/assets) -> supprime
    body = body.replace(
      /!?\[[^\]]*\]\([^)]*(?:pinit|delicious-recipes\/assets)[^)]*\)/gi,
      () => {
        junk++;
        return "";
      },
    );

    // 1. Déballe les images auto-liées : [![alt](img)](href) -> ![alt](img)
    body = body.replace(
      /\[(!\[[^\]]*\]\([^)]+\))\]\([^)]+\)/g,
      (_m, inner) => {
        unwrapped++;
        return inner;
      },
    );

    // 2. Lien-texte vers image -> image (lookbehind : ne touche pas ![...])
    body = body.replace(
      new RegExp(`(?<!\\!)\\[([^\\]\\[]*)\\]\\((https?://[^)\\s]+\\.${IMG_EXT})\\)`, "gi"),
      (_m, text, url) => {
        converted++;
        return `![${text}](${url})`;
      },
    );

    // Nettoie les lignes devenues vides (junk retiré)
    body = body.replace(/\n{3,}/g, "\n\n");

    if (body !== before) {
      fs.writeFileSync(full, matter.stringify(body, parsed.data), "utf-8");
      filesChanged++;
    }
  }
}

console.log(
  `Déballées(A)=${unwrapped}  Converties(B)=${converted}  Junk retiré=${junk}  Fichiers modifiés=${filesChanged}`,
);
