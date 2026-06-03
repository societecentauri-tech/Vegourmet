# Archive SEO vegourmet.fr — 2026-06-03

> Travaux SEO post-acquisition : analyse éditoriale, reworks v2 et siphon analytics (16 mois).
> Source : WordPress.com (REST + WP-CLI SSH), Google Search Console, Google Analytics 4.

## Contenu

| Dossier / fichier | Description |
|---|---|
| `CHARTE-EDITORIALE.md` | Ligne éditoriale extraite des 20 pages au meilleur ranking (voix Chloé, gabarits recette/guide, storyboard visuel). Référence pour toute nouvelle publication. |
| `editorial-summary.json` | Métriques éditoriales des 20 top pages (intros, structure Hn, images, alt). |
| `gsc-queries-by-topic.json` | Vraies requêtes GSC par sujet (guacamole, margarine, lait café/cluster) — base FAQ + champ lexical. |
| `drafts-v1/` | 1ère version des brouillons (6308/6309/6310) — conservée pour diff avant/après. |
| `v2/` | Reworks v2 (HTML Gutenberg + meta JSON) : guacamole→1885, margarine→2428, lait café→2458. |
| `rework-before/` | Contenu LIVE des pages ciblées avant rework (1885, 2428, 2458) — le « avant ». |
| `gsc-export/` | Export Search Console 16 mois (2025-02 → 2026-06). Les 2 gros (`by-query`, `by-query-page`) sont gzippés. |
| `ga4-export/` | Export Analytics 4 (trafic/jour, top pages). |

## Notes

- **Cannibalisation évitée** : le « nouvel article » lait café (#6308) a été reconverti en rework de la page existante 2458 (slug `meilleur-lait-vegetal-pour-cafe-guide-complet-2025`).
- Les binaires lourds (médias, dump SQL, archive wp-content) sont **hors git** (`.gitignore`), conservés sur alpha + S3 `scaleway:veg/wordpress-backup/2026-06-03/`.
- Détail mission : Grimoire `03-missions/vegourmet-acquisition/SEO-REWORK-2026-06.md`.
