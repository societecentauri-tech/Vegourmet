# Dimensions supplémentaires GSC + GA4 — vegourmet.fr

> Siphon du 2026-06-03 depuis la propriété GSC URL-prefix `https://vegourmet.fr/` et GA4 property `466965823`. Fenêtre GSC : 2025-02-01 → 2026-06-01 (16 mois). Fenêtre GA4 : 2024-10-01 → 2026-06-02.
> Les exports exhaustifs (query, query×page, page, date) sont dans les fichiers `.json` du dossier. Ce fichier consigne les petites dimensions retournées inline.

## GSC — Device (16 mois)
| Device | Clics | Impressions | CTR | Position moy |
|---|---|---|---|---|
| MOBILE | 39 761 | 739 245 | 5,38 % | 8,15 |
| DESKTOP | 6 154 | 324 943 | 1,89 % | 26,33 |
| TABLET | 750 | 16 764 | 4,47 % | 7,19 |

→ **86 % des clics = mobile.** Desktop ranke beaucoup moins bien (pos 26) = optimiser mobile en priorité.

## GSC — Pays (top, 16 mois)
| Pays | Clics | Impressions | CTR | Pos |
|---|---|---|---|---|
| France (fra) | 41 929 | 853 881 | 4,91 % | 11,7 |
| Suisse (che) | 979 | 19 439 | 5,04 % | 11,2 |
| Belgique (bel) | 707 | 17 619 | 4,01 % | 11,3 |
| Canada (can) | 663 | 23 172 | 2,86 % | 12,9 |
| Réunion (reu) | 301 | 5 361 | 5,61 % | 8,6 |
| Allemagne (deu) | 185 | 4 941 | 3,74 % | 26,9 |
| Luxembourg, Martinique, Espagne, Italie, Guadeloupe… (longue traîne FR + DOM-TOM) |

→ **~92 % du trafic = France.** Cibles secondaires naturelles : CH, BE, CA, DOM-TOM (même langue).

## GA4 — Sources de trafic (sessions, 2024-10 → 2026-06, total 145 sources)
| Source / Medium | Sessions | Users | Engaged |
|---|---|---|---|
| google / organic | 52 568 | 40 849 | 20 622 |
| **ecosia.org / organic** | **18 568** | 12 253 | 8 883 |
| (direct) / (none) | 12 463 | 9 283 | 3 004 |
| bing / organic | 4 602 | 3 560 | 2 982 |
| Pinterest / organic | 4 346 | 3 451 | 1 087 |
| duckduckgo / organic | 3 626 | 2 460 | 1 800 |
| pinterest.com / referral | 3 604 | 3 066 | 592 |
| qwant.com / organic | 2 336 | 1 676 | 1 152 |
| fr.search.yahoo.com / referral | 1 508 | 1 135 | 912 |
| search.lilo.org / referral | 1 467 | 939 | 750 |
| fr.pinterest.com / referral | 815 | 591 | 529 |
| facebook (m./lm./l./.com) referral | ~930 cumulé | | |
| flippa.com / referral | 165 | 125 | 116 |
| **chatgpt.com (referral+notset)** | **143** | | (crawlers/citations IA) |
| **perplexity (.ai + notset)** | **51** | | |
| copilot.com | 7 | | |

→ **Insights** : (1) **Ecosia = 2ᵉ source organique (18,5k)** — non négligeable, basé sur Bing. (2) **Pinterest** ~8,7k cumulé (organic+referral) = levier social majeur (cohérent avec l'audit). (3) **Moteurs IA** (ChatGPT, Perplexity, Copilot) déjà présents en référents → l'optimisation GEO/AEO (FAQ, données structurées) a du sens. (4) Méta-moteurs FR (Qwant, Lilo) actifs.

## GSC — Google Discover (16 mois)
- Discover par date : voir `gsc_discover_by-date_2025-02_2026-06.json` (a généré du trafic au pic, quasi nul depuis fév 2026)
- Discover par page (résiduel récent) : courgette-farcie (71 clics), meilleur-tofu, falafels, tofu-fumé, pesto, beurre-vegan

## Notes pour la stratégie
- Mobile-first absolu (86 % clics).
- Marché = FR + francophonie (CH/BE/CA/DOM-TOM).
- Diversité des moteurs : optimiser aussi pour **Bing/Ecosia** (même index) et **Pinterest** (visuel).
- **AEO/GEO** : les crawlers IA citent déjà le site → renforcer FAQ + schema.
