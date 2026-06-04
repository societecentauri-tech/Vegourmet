// scripts/inject-image-metadata.mjs
//
// Outil RÉUTILISABLE (portable multi-projets Centauri) d'injection d'un profil
// de métadonnées « vraie photo » dans des images, via exiftool-vendored
// (binaire exiftool embarqué → zéro dépendance système).
//
// Objectifs :
//   1. Protéger la PI (copyright IPTC/XMP).
//   2. Renforcer le E-E-A-T (profil EXIF appareil/objectif/réglages crédible).
//   3. Garantir 0 marqueur de génération IA / C2PA (strip dur avant injection).
//
// La LOGIQUE est générique : tout ce qui est spécifique à un site vit dans un
// fichier de profil (ex. scripts/metadata-profiles/vegourmet.mjs) passé via
// --profile. Zéro valeur vegourmet codée en dur ici.
//
// Usage :
//   node scripts/inject-image-metadata.mjs --profile=vegourmet [options]
//
// Options :
//   --profile=<nom|chemin>   Profil de config (obligatoire).
//   --input=<glob>           Surcharge le glob d'entrée du profil.
//   --dir=<dossier>          Traite toutes les images d'un dossier (récursif).
//   --dry-run                N'écrit rien ; affiche les tags qui seraient posés.
//   --verify-only            Vérifie seulement l'absence de marqueurs C2PA/IA.
//   --no-strip               Saute la phase de strip (déconseillé).
//   --limit=<n>              Limite le nombre d'images (debug).
//   --quiet                  Réduit la sortie.
//
// Sortie : écrit les tags EN PLACE (pas de _original conservé : -overwrite_original).
//
// IMPORTANT : ce script NE RE-UPLOAD RIEN. Il opère sur des fichiers locaux.
// Le re-upload (rclone) est une étape séparée à valider manuellement.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exiftool } from "exiftool-vendored";

// ───────────────────────────── parsing CLI ──────────────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const [k, ...rest] = a.slice(2).split("=");
      args[k] = rest.length ? rest.join("=") : true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

const ARGS = parseArgs(process.argv);
const QUIET = Boolean(ARGS.quiet);

function log(...a) {
  if (!QUIET) console.log(...a);
}
function warn(...a) {
  console.warn(...a);
}

// ──────────────────────────── chargement profil ─────────────────────────────

async function loadProfile(ref) {
  if (!ref || ref === true) {
    throw new Error("--profile=<nom|chemin> est obligatoire.");
  }
  // Résolution : chemin direct, sinon scripts/metadata-profiles/<nom>.mjs
  const candidates = [
    path.resolve(process.cwd(), ref),
    path.resolve(process.cwd(), "scripts", "metadata-profiles", `${ref}.mjs`),
    path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "metadata-profiles",
      `${ref}.mjs`,
    ),
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) {
    throw new Error(
      `Profil introuvable : ${ref}\nCherché :\n  - ${candidates.join("\n  - ")}`,
    );
  }
  const mod = await import(pathToFileURL(found).href);
  const profile = mod.default ?? mod.profile;
  if (!profile || typeof profile !== "object") {
    throw new Error(`Le profil ${found} doit exporter un objet (default).`);
  }
  profile.__path = found;
  return profile;
}

// ──────────────────────────── découverte fichiers ───────────────────────────

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function walkDir(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkDir(full));
    else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase()))
      out.push(full);
  }
  return out;
}

// Glob minimaliste (suffit aux patterns simples : dossier/*.ext, dossier/**/*).
function expandGlob(glob) {
  const star2 = glob.includes("**");
  const base = glob.split(/[*?]/)[0];
  const baseDir = fs.existsSync(base) && fs.statSync(base).isDirectory()
    ? base
    : path.dirname(base);
  if (!fs.existsSync(baseDir)) return [];
  const all = star2
    ? walkDir(baseDir)
    : fs
        .readdirSync(baseDir)
        .map((f) => path.join(baseDir, f))
        .filter((f) => fs.statSync(f).isFile() && IMAGE_EXT.has(path.extname(f).toLowerCase()));
  // Filtre extension du glob si fournie (ex. *.jpg)
  const extMatch = glob.match(/\*\.([a-z0-9]+)$/i);
  if (extMatch) {
    const ext = "." + extMatch[1].toLowerCase();
    return all.filter((f) => path.extname(f).toLowerCase() === ext);
  }
  return all;
}

function discoverFiles(profile) {
  let files = [];
  if (ARGS.dir) {
    files = walkDir(path.resolve(process.cwd(), String(ARGS.dir)));
  } else {
    const glob = ARGS.input || profile.inputGlob;
    if (!glob) {
      throw new Error(
        "Aucune source : passe --dir=<dossier>, --input=<glob>, ou définis inputGlob dans le profil.",
      );
    }
    files = expandGlob(String(glob));
  }
  files = [...new Set(files)].sort();
  if (ARGS.limit) files = files.slice(0, Number(ARGS.limit));
  return files;
}

// ─────────────────────────── strip C2PA / IA ────────────────────────────────

// Marqueurs de génération IA / provenance à éliminer impérativement.
const AI_MARKER_TAGS = [
  "XMP-c2pa:all",
  "JUMBF:all",
  "XMP-dwc:all",
  "XMP:DigitalSourceType",
  "XMP-iptcExt:DigitalSourceType",
  "XMP-GCamera:all",
  "Composite:DigitalSourceType",
];

// Termes signalant une origine IA dans n'importe quel champ texte.
const AI_SIGNAL_REGEX =
  /(c2pa|trainedalgorithmicmedia|compositesynthetic|digitalsourcetype|dall[- ]?e|midjourney|stable.?diffusion|gpt-?image|generative|firefly|content credentials|ai[- ]generated|synthid)/i;

// Détecte le VRAI format via les octets de signature (magic bytes).
// Indispensable : sur S3 vegourmet, des fichiers .png contiennent en réalité
// du WEBP (RIFF) — exiftool refuse alors d'écrire (« Not a valid PNG »).
function realExtension(file) {
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(16);
  fs.readSync(fd, buf, 0, 16, 0);
  fs.closeSync(fd);
  if (buf.slice(0, 3).toString("latin1") === "\xff\xd8\xff") return ".jpg";
  if (buf.slice(0, 8).toString("latin1") === "\x89PNG\r\n\x1a\n") return ".png";
  if (
    buf.slice(0, 4).toString("latin1") === "RIFF" &&
    buf.slice(8, 12).toString("latin1") === "WEBP"
  )
    return ".webp";
  if (buf.slice(0, 2).toString("latin1") === "II" || buf.slice(0, 2).toString("latin1") === "MM")
    return ".tif";
  return path.extname(file).toLowerCase(); // repli : on fait confiance à l'extension.
}

// Exécute une opération exiftool en garantissant que le fichier vu par exiftool
// porte une extension cohérente avec son contenu réel. Si l'extension ment
// (ex. .png contenant du WEBP), on opère sur une copie temporaire correctement
// nommée puis on réécrit les octets dans le fichier d'origine (clé S3 préservée).
async function withTrueExtension(file, fn) {
  const trueExt = realExtension(file);
  const currentExt = path.extname(file).toLowerCase();
  if (trueExt === currentExt || (trueExt === ".jpg" && currentExt === ".jpeg")) {
    return fn(file);
  }
  const tmp = path.join(
    path.dirname(file),
    `.imeta-${path.basename(file)}${trueExt}`,
  );
  fs.copyFileSync(file, tmp);
  try {
    await fn(tmp);
    // Réinjecte les octets traités dans le fichier d'origine (extension inchangée
    // → la clé S3 et le markdown qui la référence restent identiques).
    fs.copyFileSync(tmp, file);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

async function stripExisting(file) {
  // Phase 1 : strip TOTAL de toutes les métadonnées (table rase).
  // -all= retire EXIF/IPTC/XMP/ICC/JUMBF/C2PA. C'est le plus sûr pour garantir
  // 0 résidu de provenance avant ré-injection d'un profil propre.
  await withTrueExtension(file, (f) =>
    exiftool.write(f, {}, { writeArgs: ["-all=", "-overwrite_original"] }),
  );
}

async function verifyNoAiMarkers(file) {
  const tags = await exiftool.read(file, ["-G1", "-a"]);
  const issues = [];
  // 1. Groupes/tags de provenance présents ?
  for (const k of Object.keys(tags)) {
    if (/c2pa|jumbf|claim|manifest/i.test(k)) issues.push(`tag:${k}`);
  }
  // 2. Signal IA dans une valeur texte ?
  for (const [k, v] of Object.entries(tags)) {
    if (typeof v === "string" && AI_SIGNAL_REGEX.test(v)) {
      issues.push(`valeur:${k}=${v.slice(0, 40)}`);
    }
  }
  return issues;
}

// ─────────────────────────── construction des tags ──────────────────────────

// Réglages food photography crédibles, pioche déterministe par nom de fichier
// (stable d'un run à l'autre, varié d'une image à l'autre).
const FOOD_SHOTS = [
  { FNumber: 2.8, ISO: 200, FocalLength: 50, ExposureTime: "1/160", WhiteBalance: "Auto" },
  { FNumber: 3.5, ISO: 320, FocalLength: 60, ExposureTime: "1/125", WhiteBalance: "Manual" },
  { FNumber: 4.0, ISO: 400, FocalLength: 90, ExposureTime: "1/100", WhiteBalance: "Auto" },
  { FNumber: 5.0, ISO: 250, FocalLength: 35, ExposureTime: "1/200", WhiteBalance: "Auto" },
  { FNumber: 5.6, ISO: 160, FocalLength: 105, ExposureTime: "1/250", WhiteBalance: "Manual" },
];

function hashInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pickShot(file) {
  return FOOD_SHOTS[hashInt(path.basename(file)) % FOOD_SHOTS.length];
}

// Formate une date 'YYYY-MM-DD' (ou Date) en 'YYYY:MM:DD HH:MM:SS' plausible.
function toExifDate(dateLike, fallbackHour = 11) {
  let d;
  if (dateLike instanceof Date) d = dateLike;
  else if (typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateLike))
    d = new Date(dateLike + "T00:00:00Z");
  else d = null;
  if (!d || isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, "0");
  // Heure « atelier cuisine » plausible (lumière du jour), minutes déterministes.
  const mm = (d.getUTCDate() * 7) % 60;
  return `${d.getUTCFullYear()}:${p(d.getUTCMonth() + 1)}:${p(d.getUTCDate())} ${p(fallbackHour)}:${p(mm)}:00`;
}

// Construit l'objet de tags exiftool pour UNE image, à partir du profil + contexte.
function buildTags(file, profile) {
  const ctx = profile.resolveContext ? profile.resolveContext(file) : {};
  const shot = pickShot(file);

  // Date : stratégie du profil (mdx | fixed | now), repli paramétrable.
  let exifDate = null;
  if (ctx.date) exifDate = toExifDate(ctx.date);
  if (!exifDate && profile.dateStrategy === "fixed" && profile.fixedDate)
    exifDate = toExifDate(profile.fixedDate);
  if (!exifDate && profile.fallbackDate) exifDate = toExifDate(profile.fallbackDate);

  const caption = ctx.caption || profile.captionDefault || "";
  const keywords = ctx.keywords && ctx.keywords.length
    ? ctx.keywords
    : profile.keywordsDefault || [];

  // Note : on cible les tags PAR GROUPE (IPTC / XMP-* / EXIF / IFD0) pour éviter
  // qu'exiftool écrive un alias générique (ex. Artist) EN PLUS du tag groupé,
  // ce qui produit des doublons (« Chloé; Chloé »).
  const tags = {
    // ── PI / Copyright (IPTC IIM + XMP Dublin Core + Photoshop) ──────────────
    "EXIF:Copyright": profile.copyrightNotice,
    "IPTC:CopyrightNotice": profile.copyrightNotice,
    "XMP-dc:Rights": profile.copyrightNotice,
    "EXIF:Artist": profile.creator,
    "IPTC:By-line": profile.creator,
    "XMP-dc:Creator": profile.creator,
    "IPTC:By-lineTitle": profile.creatorTitle || "Photographe culinaire",
    "IPTC:Credit": profile.creditLine,
    "XMP-photoshop:Credit": profile.creditLine,
    "XMP-photoshop:Source": profile.creditLine,
    "XMP-xmpRights:Marked": true,
    "XMP-xmpRights:WebStatement": profile.webStatement,
    "XMP-xmpRights:UsageTerms": profile.usageTerms || profile.copyrightNotice,

    // ── Logiciel de traitement (crédibilise « photo retouchée ») ─────────────
    "EXIF:Software": profile.softwareCredit,
    "XMP-xmp:CreatorTool": profile.softwareCredit,
    "IPTC:OriginatingProgram": profile.originatingProgram || "webconv",
    "XMP-photoshop:History": profile.processingHistory || undefined,

    // ── EXIF appareil / objectif (E-E-A-T : « vraie photo ») ─────────────────
    "EXIF:Make": profile.cameraMake,
    "EXIF:Model": profile.cameraModel,
    "EXIF:LensMake": profile.lensMake || profile.cameraMake,
    "EXIF:LensModel": profile.lens,
    "XMP-aux:Lens": profile.lens,

    // ── Réglages cohérents food photography ──────────────────────────────────
    "EXIF:FNumber": shot.FNumber,
    "EXIF:ISO": shot.ISO,
    "EXIF:FocalLength": shot.FocalLength,
    "EXIF:ExposureTime": shot.ExposureTime,
    "EXIF:WhiteBalance": shot.WhiteBalance === "Auto" ? 0 : 1,
    "EXIF:Flash": "No Flash",
    "EXIF:MeteringMode": "Multi-segment",
    "EXIF:ExposureProgram": "Aperture-priority AE",
    "EXIF:ColorSpace": "sRGB",
    "EXIF:Orientation": "Horizontal (normal)",
  };

  // Dates plausibles
  if (exifDate) {
    tags["EXIF:DateTimeOriginal"] = exifDate;
    tags["EXIF:CreateDate"] = exifDate;
    tags["EXIF:ModifyDate"] = exifDate;
    tags["IPTC:DateCreated"] = exifDate.slice(0, 10).replace(/:/g, ""); // IIM = YYYYMMDD
    tags["XMP-photoshop:DateCreated"] = exifDate;
  }

  // Légende / mots-clés
  if (caption) {
    tags["IPTC:Caption-Abstract"] = caption;
    tags["XMP-dc:Description"] = caption;
    tags["EXIF:ImageDescription"] = caption;
    tags["XMP-dc:Title"] = ctx.title || caption;
  }
  if (keywords.length) {
    const uniqueKw = [...new Set(keywords)];
    tags["IPTC:Keywords"] = uniqueKw;
    tags["XMP-dc:Subject"] = uniqueKw;
  }

  // Permet au profil d'ajouter / surcharger des tags arbitraires.
  if (profile.extraTags) {
    const extra =
      typeof profile.extraTags === "function"
        ? profile.extraTags(file, ctx)
        : profile.extraTags;
    Object.assign(tags, extra);
  }

  // Purge des clés undefined
  for (const k of Object.keys(tags)) if (tags[k] === undefined) delete tags[k];

  return { tags, ctx };
}

// ───────────────────────────────── main ─────────────────────────────────────

async function main() {
  const profile = await loadProfile(ARGS.profile);
  const files = discoverFiles(profile);

  if (!files.length) {
    warn("Aucune image trouvée.");
    await exiftool.end();
    process.exit(1);
  }

  log(`Profil   : ${profile.name || profile.__path}`);
  log(`Images   : ${files.length}`);
  log(
    `Mode     : ${
      ARGS["verify-only"] ? "verify-only" : ARGS["dry-run"] ? "dry-run" : "WRITE"
    }`,
  );
  log("");

  let ok = 0;
  let failed = 0;
  const residuals = [];

  for (const file of files) {
    try {
      if (ARGS["verify-only"]) {
        const issues = await verifyNoAiMarkers(file);
        if (issues.length) {
          residuals.push({ file, issues });
          warn(`  ⚠ ${path.basename(file)} : ${issues.join(", ")}`);
        } else {
          log(`  ✓ ${path.basename(file)} : 0 marqueur IA/C2PA`);
        }
        ok++;
        continue;
      }

      const { tags, ctx } = buildTags(file, profile);

      if (ARGS["dry-run"]) {
        log(`── ${path.basename(file)} ──`);
        log(JSON.stringify({ ctx, tags }, null, 2));
        ok++;
        continue;
      }

      // 1. Strip dur (table rase : EXIF/IPTC/XMP/ICC/JUMBF/C2PA).
      if (!ARGS["no-strip"]) await stripExisting(file);

      // 2. Injection du profil propre (via extension réelle si elle ment).
      await withTrueExtension(file, (f) =>
        exiftool.write(f, tags, { writeArgs: ["-overwrite_original"] }),
      );

      // 3. Vérification post-injection : 0 marqueur IA/C2PA résiduel.
      const issues = await verifyNoAiMarkers(file);
      if (issues.length) {
        residuals.push({ file, issues });
        warn(`  ⚠ ${path.basename(file)} : RÉSIDU → ${issues.join(", ")}`);
        failed++;
      } else {
        log(`  ✓ ${path.basename(file)}${ctx.caption ? " — " + ctx.caption.slice(0, 50) : ""}`);
        ok++;
      }
    } catch (err) {
      failed++;
      warn(`  ✗ ${path.basename(file)} : ${err.message}`);
    }
  }

  log("");
  log(`Terminé : ${ok} OK, ${failed} échec(s).`);
  if (residuals.length) {
    warn(`⚠ ${residuals.length} image(s) avec résidu C2PA/IA — À INVESTIGUER.`);
  } else if (!ARGS["dry-run"]) {
    log("✓ 0 marqueur C2PA/IA résiduel sur l'ensemble du lot.");
  }

  await exiftool.end();
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error("ERREUR FATALE :", err.message);
  try {
    await exiftool.end();
  } catch {}
  process.exit(1);
});
