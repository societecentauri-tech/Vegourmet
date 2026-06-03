# Archive WordPress vegourmet.fr

> Sauvegarde et audit du site WordPress.com **avant migration Next.js**.
> Source : `vegourmet.fr` (WordPress.com Business / Atomic, site ID `238549663`).
> Acquisition closée mai-juin 2026 (cf. `audit/LOG.md`).

## Contenu de ce dossier

| Dossier | Contenu | Source |
|---|---|---|
| `audit/` | Audit d'acquisition complet (V1 markdown + PDF 34 p.), stack technique, checklist de transfert des accès, log de mission, mission DNS | Grimoire `03-missions/vegourmet-acquisition` |
| `content/` | Export structuré de **tout le contenu** (REST API) : 134 recettes, 40 articles, 17 pages, 5 catégories, 44 équipements, 2696 commentaires | REST `/wp-json/wp/v2` (2026-06-03) |
| `manifests/` | Manifeste des **1367 médias** (URLs + métadonnées + variantes) | REST `/wp-json/wp/v2/media` |

## Ce qui N'EST PAS dans git (volumineux → alpha + S3)

| Élément | Emplacement | Taille |
|---|---|---|
| Binaires médias (1367 fichiers originaux) | `alpha:/home/greg/backups/vegourmet/<date>/media/files/` + S3 | ~614 Mo |
| Dump SQL base de données complète | `alpha:.../db/` (via SSH WP.com) | — |
| Archive `wp-content` (thème + plugins + uploads) | `alpha:.../files/` (via SFTP WP.com) | — |

## Snapshot contenu (2026-06-03)

```
recipes:    134   (CPT `recipe`, dernier pub. 2026-01-29)
posts:       40   (dernier pub. 2025-07-10)
pages:       17
categories:   5   (0 tag)
equipment:   44   (CPT Delicious Recipes)
comments:  2696   (spam-lourd probable)
media:     1367   (~614 Mo originaux)
```

> ⚠️ L'audit V1 estimait 172 recettes / 37 articles. Le **comptage live réel = 134 / 40**.

## Limite du backup REST (pourquoi un dump SQL reste nécessaire)

L'export REST capture le contenu rendu + les taxonomies, **mais pas** :
- les `postmeta` structurés des recettes (ingrédients/étapes en champs Delicious Recipes)
- `wp_options` (réglages plugins : Rank Math, WP Rocket, Popup Maker, Grow.me…)
- les tables custom des plugins

→ Un **backup total** exige le dump SQL + l'archive fichiers via SSH/SFTP WordPress.com (voir `PROCEDURE-BACKUP-TOTAL.md`).

## Restauration / réutilisation

- **Migration Next.js** : `content/*.json` est la source directe pour le repo (`recipes.json` → pages MDX/recettes).
- **Restauration WordPress** : utiliser le dump SQL + `wp-content` (PAS le JSON REST, incomplet).
- **Filet live** : Jetpack VaultPress Backup (inclus Business) reste actif côté Automattic — restauration point-in-time depuis `wordpress.com/backup/vegourmet.fr`.
