// scripts/metadata-profiles/vegourmet.mjs
//
// Profil de métadonnées « vraie photo » pour vegourmet.fr.
// Consommé par scripts/inject-image-metadata.mjs (--profile=vegourmet).
//
// AUCUNE logique d'injection ici : uniquement de la configuration + la
// résolution du contexte éditorial (titre / date / ingrédients / alt) à partir
// des MDX, en mappant chaque image S3 par son nom de fichier (sha1.ext).
//
// E-E-A-T : l'auteur des publications vegourmet est CHLOÉ (jamais Grégory).
//
// ⚠ Valeurs à valider par Greg : cameraMake / cameraModel / lens (boîtier +
// objectif macro food). Voir le tableau dans le README.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIRS = [
  path.join(ROOT, "content", "recettes"),
  path.join(ROOT, "content", "blog"),
];

// ───────────── Index image (sha1.ext) → contexte éditorial MDX ───────────────
// Construit une seule fois, en lazy, au premier resolveContext().

let IMG_INDEX = null;

function basenameOf(url) {
  try {
    return path.basename(new URL(url).pathname);
  } catch {
    return path.basename(String(url).split("?")[0]);
  }
}

// Mots-clés « food » dérivés du titre + ingrédients principaux.
function deriveKeywords(data) {
  const kw = new Set(["cuisine vegan", "recette vegan", "food photography"]);
  const title = String(data.title || "");
  // Tokens significatifs du titre (mots > 3 lettres, hors ponctuation SEO).
  for (const tok of title
    .replace(/[:|–—-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 3 && !/^(recette|facile|vegan|pour|avec|sans)$/i.test(t))) {
    kw.add(tok.toLowerCase());
  }
  // Ingrédients : on garde le nom « nettoyé » (retire quantités/unités au début).
  for (const ing of (data.ingredients || []).slice(0, 8)) {
    const raw = String(ing?.name || "").trim();
    if (!raw) continue;
    const clean = raw
      .replace(/^[\d.,/ ]+/, "")
      .replace(/^(g|kg|ml|cl|l|càc|càs|c\.à\.c|c\.à\.s|sachet|pincée|gousse|tranche|pièces?)\s+/i, "")
      .trim();
    if (clean.length > 2) kw.add(clean.toLowerCase());
  }
  return [...kw].slice(0, 18);
}

function buildIndex() {
  const index = new Map();
  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const fname of fs.readdirSync(dir)) {
      if (!fname.endsWith(".mdx")) continue;
      const full = path.join(dir, fname);
      let parsed;
      try {
        parsed = matter(fs.readFileSync(full, "utf8"));
      } catch {
        continue;
      }
      const { data, content } = parsed;
      const title = data.title || "";
      const date = data.datePublished || data.date || null;
      const keywords = deriveKeywords(data);

      // 1. heroImage
      const hero = data.heroImage?.src;
      if (hero) {
        index.set(basenameOf(hero), {
          title,
          date,
          caption: title,
          keywords,
        });
      }

      // 2. Images du corps : ![alt](url) → caption = alt (sinon titre).
      for (const m of content.matchAll(
        /!\[([^\]]*)\]\((https:\/\/veg\.s3\.fr-par\.scw\.cloud\/img\/[^)]+)\)/g,
      )) {
        const alt = (m[1] || "").trim();
        const bn = basenameOf(m[2]);
        // Ne pas écraser un mapping plus riche déjà posé pour cette image.
        if (!index.has(bn) || (alt && index.get(bn).caption === title)) {
          index.set(bn, {
            title,
            date,
            caption: alt || title,
            keywords,
          });
        }
      }
    }
  }
  return index;
}

// ───────────────────────────── profil exporté ───────────────────────────────

const profile = {
  name: "vegourmet.fr",

  // Source des images locales à traiter (override possible via --dir / --input).
  // Par défaut : dossier où l'on télécharge l'échantillon S3 pour la preuve.
  inputGlob: "/tmp/veg-sample/*",

  // ── PI / Copyright ─────────────────────────────────────────────────────────
  copyrightHolder: "Vegourmet",
  copyrightNotice: "© 2026 Vegourmet — Tous droits réservés",
  creator: "Chloé",
  creatorTitle: "Photographe culinaire",
  creditLine: "Vegourmet",
  webStatement: "https://vegourmet.fr",
  usageTerms:
    "Usage réservé à Vegourmet (https://vegourmet.fr). Toute reproduction interdite sans autorisation écrite.",

  // ── Logiciel de traitement (réalisme max : « photo shootée + retouchée ») ──
  // softwareCredit alimente EXIF:Software + XMP-xmp:CreatorTool : on met un vrai
  // logiciel de retouche pro (Lightroom) → crédibilise « vraie photo retouchée ».
  // webconv.com est RÉSERVÉ à l'étape d'export web (sa place naturelle) :
  // IPTC:OriginatingProgram + XMP-photoshop:History.
  softwareCredit: "Adobe Photoshop Lightroom Classic 13.2",
  originatingProgram: "webconv.com",
  processingHistory: "Optimisé pour le web avec webconv.com (https://webconv.com)",

  // ── EXIF appareil / objectif (VALEURS PAR DÉFAUT — à valider par Greg) ──────
  // Boîtier hybride APS-C plébiscité en food/lifestyle, objectif macro food.
  cameraMake: "FUJIFILM",
  cameraModel: "X-T5",
  lensMake: "FUJIFILM",
  lens: "XF 80mm F2.8 R LM OIS WR Macro",

  // ── Dates ──────────────────────────────────────────────────────────────────
  // 'mdx' : lit datePublished du MDX correspondant (via resolveContext).
  dateStrategy: "mdx",
  fallbackDate: "2025-10-01", // si aucune date MDX trouvée pour l'image.

  // ── Défauts caption / keywords (si image non trouvée dans les MDX) ──────────
  captionDefault: "Recette vegan — Vegourmet",
  keywordsDefault: ["cuisine vegan", "recette vegan", "food photography"],

  // ── Résolution du contexte par image ───────────────────────────────────────
  resolveContext(filePath) {
    if (!IMG_INDEX) IMG_INDEX = buildIndex();
    const bn = path.basename(filePath);
    const hit = IMG_INDEX.get(bn);
    if (hit) {
      return {
        title: hit.title,
        date: hit.date,
        caption: hit.caption,
        keywords: hit.keywords,
      };
    }
    // Image non référencée dans les MDX : on retombe sur les défauts.
    return {
      title: this.captionDefault,
      date: this.fallbackDate,
      caption: this.captionDefault,
      keywords: this.keywordsDefault,
    };
  },
};

export default profile;
