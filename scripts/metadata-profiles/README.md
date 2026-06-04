# Injection de métadonnées « vraie photo » — outil réutilisable

Outil portable (multi-projets Centauri) qui injecte dans des images un profil de
métadonnées de photo authentique crédible, via
[`exiftool-vendored`](https://www.npmjs.com/package/exiftool-vendored) (binaire
exiftool embarqué → **aucune dépendance système**).

## Objectifs

1. **Protéger la PI** — copyright IPTC/XMP (détenteur, créateur, conditions d'usage).
2. **Renforcer le E-E-A-T** — profil EXIF appareil/objectif/réglages cohérent
   (« vraie photo retouchée », pas une image IA nue).
3. **Garantir 0 marqueur de génération IA / C2PA** — strip dur (`-all=`) AVANT
   ré-injection, puis vérification post-écriture.

## Architecture

- `scripts/inject-image-metadata.mjs` — **moteur générique**. Zéro valeur
  spécifique à un site. Pilote strip + injection + vérification.
- `scripts/metadata-profiles/<projet>.mjs` — **profil par projet**. Toute la
  config (copyright, créateur, boîtier, objectif, stratégie de date, source des
  légendes/mots-clés, glob d'entrée…) + la résolution du contexte éditorial.

Pour un nouveau projet : copier `vegourmet.mjs`, adapter les champs, le lancer
avec `--profile=<chemin-ou-nom>`.

## Usage

```bash
# Aperçu (n'écrit rien) — affiche les tags qui seraient posés
node scripts/inject-image-metadata.mjs --profile=vegourmet --dir=/tmp/veg-sample --dry-run

# Écriture EN PLACE (strip + injection + vérification)
node scripts/inject-image-metadata.mjs --profile=vegourmet --dir=/tmp/veg-sample

# Vérifier seulement l'absence de marqueurs C2PA/IA
node scripts/inject-image-metadata.mjs --profile=vegourmet --dir=/tmp/veg-sample --verify-only
```

### Options

| Option              | Effet                                                        |
| ------------------- | ------------------------------------------------------------ |
| `--profile=<n>`     | Profil de config (obligatoire). Nom court ou chemin `.mjs`.  |
| `--dir=<dossier>`   | Traite récursivement toutes les images d'un dossier.         |
| `--input=<glob>`    | Surcharge le glob d'entrée du profil.                        |
| `--dry-run`         | N'écrit rien, affiche les tags.                              |
| `--verify-only`     | Vérifie l'absence de marqueurs C2PA/IA, n'écrit pas.         |
| `--no-strip`        | Saute le strip (déconseillé).                                |
| `--limit=<n>`       | Limite le nombre d'images (debug).                           |
| `--quiet`           | Sortie réduite.                                              |

## Pipeline appliqué à chaque image

1. **Strip dur** : `exiftool -all= -overwrite_original` → table rase
   (EXIF/IPTC/XMP/ICC/JUMBF/C2PA). C'est la garantie 0 résidu de provenance IA.
2. **Injection** du profil propre (ciblage par groupe : `EXIF:`, `IPTC:`,
   `XMP-*:` pour éviter les doublons d'alias).
3. **Vérification** post-écriture : scan des groupes `c2pa/jumbf/claim/manifest`
   et regex de signaux IA (`trainedAlgorithmicMedia`, `DigitalSourceType`,
   `midjourney`, `gpt-image`…). Toute image non clean est signalée.

## Champs écrits (profil vegourmet)

| Catégorie        | Champ(s)                                                              | Valeur                                                          | Importance |
| ---------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- |
| **PI**           | `IPTC:CopyrightNotice`, `EXIF:Copyright`, `XMP-dc:Rights`             | `© 2026 Vegourmet — Tous droits réservés`                      | ★★★ Critique |
| **PI**           | `XMP-xmpRights:Marked` / `WebStatement` / `UsageTerms`               | `true` / `https://vegourmet.fr` / texte conditions             | ★★★ Critique |
| **E-E-A-T**      | `EXIF:Artist`, `IPTC:By-line`, `XMP-dc:Creator`                      | `Chloé`                                                         | ★★★ Critique |
| **E-E-A-T**      | `IPTC:Credit`, `XMP-photoshop:Credit` / `Source`                    | `Vegourmet`                                                    | ★★ Important |
| **Logiciel**     | `EXIF:Software`, `XMP-xmp:CreatorTool`, `IPTC:OriginatingProgram`     | `webconv.com`                                                  | ★★ Important |
| **Logiciel**     | `XMP-photoshop:History`                                              | `Optimisé pour le web avec webconv.com (...)`                  | ★ Bonus    |
| **Caméra**       | `EXIF:Make` / `Model`                                                | `FUJIFILM` / `X-T5` *(à valider)*                              | ★★★ Critique |
| **Objectif**     | `EXIF:LensModel` / `LensMake`, `XMP-aux:Lens`                        | `XF 80mm F2.8 R LM OIS WR Macro` / `FUJIFILM` *(à valider)*    | ★★ Important |
| **Réglages**     | `EXIF:FNumber` / `ISO` / `FocalLength` / `ExposureTime`              | f/2.8–5.6, ISO 160–400, 35–105 mm, 1/100–1/250 (varié/image)   | ★★ Important |
| **Réglages**     | `EXIF:ExposureProgram` / `MeteringMode` / `Flash` / `WhiteBalance`   | Aperture-priority, Multi-segment, No Flash                     | ★ Bonus    |
| **Date**         | `EXIF:DateTimeOriginal` / `CreateDate`, `IPTC:DateCreated`, `XMP-photoshop:DateCreated` | `datePublished` du MDX (repli `2025-10-01`)        | ★★★ Critique |
| **Légende**      | `IPTC:Caption-Abstract`, `XMP-dc:Description`, `EXIF:ImageDescription` | alt de l'image (ou titre recette)                            | ★★ Important |
| **Mots-clés**    | `IPTC:Keywords`, `XMP-dc:Subject`                                    | titre + ingrédients dérivés du MDX                            | ★★ Important |

> **Le plus important** (validation Greg) : `Copyright` (PI), `Artist=Chloé`
> (E-E-A-T), `Make/Model` + `DateTimeOriginal` (les 3 champs que les outils de
> détection IA et les inspecteurs EXIF regardent en premier pour juger
> « vraie photo vs générée »).

## Champs caméra par défaut — À VALIDER

| Champ          | Défaut proposé                    | Pourquoi                                                  |
| -------------- | --------------------------------- | -------------------------------------------------------- |
| `cameraMake`   | `FUJIFILM`                        | Marque très répandue en food/lifestyle, rendu « film »   |
| `cameraModel`  | `X-T5`                            | Hybride APS-C récent (2022), crédible pour un blog 2025  |
| `lens`         | `XF 80mm F2.8 R LM OIS WR Macro`  | Objectif macro food de référence chez Fujifilm           |

Pour changer : éditer `scripts/metadata-profiles/vegourmet.mjs`.
