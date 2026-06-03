---
status: in_progress
next_review_date: 2026-06-08
---
# Mission — Audit d'acquisition vegourmet.fr

> **Tâche** : `DOC-CEN-20260504-0005`
> **Statut** : En attente — décision GO/NO-GO contractuelle côté Greg + vendeuse
> **Verdict actuel** : GO à 4 000 € sous 5 conditions contractuelles (cession photos, sociaux, juridique, séquestre 30 %/60 j)

## Contexte

Greg dispose d'un accès GA4 sur la propriété Vegourmet (ID `466965823`, compte `Vegourmet` 336268931) accordé par `vegourmet.contact@gmail.com` via le compte Google `societe.centauri@gmail.com`. Accès GSC `siteRestrictedUser` également disponible sur `https://vegourmet.fr/`. Objectif : audit complet pour décider si le rachat du site est une bonne idée.

Le prix annoncé par la vendeuse est de **4 000 €** (info révélée en cours de session). Il n'y a **aucun revenu actuel** sur le site (pas d'AdSense activé, affiliations Greenweez/Fnty/Amazon non quantifiées).

## Sessions

### 2026-05-04 — Session 1 (audit data + rapport PDF)

**Réalisé** :
- Bascule auth MCP google-seo de `contact@projetcentauri.com` vers `societe.centauri@gmail.com`
- Audit GA4 12 mois : 101 277 sessions, chute -58 % entre déc 2025 et avr 2026
- Audit GSC 12 mois : 45 137 clics / 1 028 580 impressions, position moy 14,3
- Analyse comparée nov 2025 (pic) vs avr 2026 : Organic Search -63 %, page guacamole -98 %
- Diagnostic chute : corrélation avec Discover Core Update fév 2026, Spam Update 24 mars, Core Update 27 mars - 8 avril
- Audit live : auteure Chloé identifiée, WordPress, affiliations Greenweez/Fnty/Amazon, pas d'AdSense
- Schema audit : 11 review snippets dupliqués + warnings champs Recipe (`name`, `url`, `video`, `calories`)
- Recherche concurrence niche vegan FR (100-vegetal, antigone21, vegan-pratique L214, chefsimon)
- Multiples Flippa 2025-2026 : 30-45× EBITDA mensuel blog stable, 20-30× blog risqué
- Rapport PDF généré via `centauri-docs` (Pandoc + Typst) : 34 pages, charte Centauri (#1B2541 navy + #C8963E gold)
- PDF stocké dans `output/audit-vegourmet-v1.pdf`
- Inséré dans `centauri_resources` (id `91fb1d68-7d17-4c4a-b6e2-7bf3dc42887e`, site Projet Centauri)

**Décision (verdict initial)** :
- Acquisition envisageable sous 3 conditions strictes (DR via Ahrefs, preuve revenus 12M, cession droits photos + Pinterest)
- Fourchette prix recommandée : **8 000 € à 14 000 €**, point d'ancrage 11 000 €
- No-Go au-delà de 18 000 € sans EBITDA prouvé > 800 €/mois

**Recalibrage post-révélation prix vendeur (4 000 €)** :
- Greg annonce que la vendeuse propose 4 000 €. Le verdict change : **GO recommandé** car prix < valeur des actifs séparés (~10 500 € après ajustement DR faible). Asymétrie risque/rendement très favorable.
- Conditions allégées car le prix absorbe le risque : audit Ahrefs préalable n'est plus obligatoire (suffisant après cession).
- Conditions impératives qui restent : Manual Actions GSC vert + cession écrite droits photos + cession Pinterest.

**Vérification Manual Actions** :
- Greg confirme : "Aucun problème détecté" dans GSC. **Condition 1 levée.**

**Vérification backlinks (35 domaines référents)** :
- Profil GSC fourni par Greg : Pinterest 26/14, sushimidori.be 13/8, cooknblog.com, passionrecettes.com, blogs-de-cuisine.com, ~30 autres petits blogs FR cuisine + 1-2 liens étranges (bij1.org, shopvip.fr) sans signature PBN.
- Verdict : **profil faible mais propre**, pas de PBN. DR estimé 5-12. Aucun trust anchor majeur (pas de Marmiton, 750g, etc.). C'est précisément ce qui explique la fragilité aux Core Updates : pas de coussin d'autorité.
- **Condition backlinks levée** à 4 000 €.

**Audit technique stack** (révélation hébergeur Automattic) :
- WordPress.com Business plan (Automattic Atomic) + Cloudflare CDN devant
- Theme Yummy Bites Pro (premium recettes) + plugins WP Rocket 3.17.3.1, Rank Math, Jetpack (WAF + Backup + Protect), Akismet, Delicious Recipes, Code Snippets, WP Forms, Cookie Notice, Popup Maker, WP Table Builder
- Sécurité : TLS 1.3 + HSTS 1 an + WAF double couche (Jetpack + Cloudflare). CSP faible (`block-all-mixed-content` seul). `/wp-login.php` exposé mais protégé Jetpack Protect.
- Patches gérés par Automattic = zéro charge ops infra
- Robots.txt géré par Cloudflare Managed Content (bloque GPTBot, ClaudeBot, Google-Extended)
- Sitemap dernière mise à jour 4 février 2026 = pas de publication récente, cohérent avec capitulation vendeuse
- Coûts récurrents post-acquisition : ~400-650 €/an (WP.com Business 250 € + WP Rocket 55 € + Rank Math Pro 55 € + Yummy Bites Pro 37 € + domaine 12 €)

**Stratégie migration vers stack Centauri (Next.js + MDX + Vercel + S3)** :
- 3 options évaluées : (A) immédiate M+1, (B) différée M+4-M+6, (C) pas de migration (intégration légère).
- **Option B retenue** : éviter cumul choc Google + choc migration. À M+3 décision GO/NO-GO migration sur la base de la stabilisation du trafic.
- Effort migration : ~12-13 j-h interne (Gauvain + Bohort + Lamorak + Yvain). Coût cash externe ~0 € (Vercel inclus, S3 marginal). Économies récurrentes 400 €/an dès la coupure WP.com.
- Risque dominant : perte SEO temporaire 1-3 mois post-migration. Mitigation : cartographie 1:1 URLs, redirections 301 exhaustives, cutover progressif via subdomain de test.

**TL;DR pour Victor produit en fin de session** :
- Pitch : blog FR recettes vegan, 7 500 sessions/mois, proposé 4 000 €, valeur actifs ~10 500 €
- Vraie thèse d'achat : tunnel d'acquisition vers MCG + levier monétisation immédiat (AdSense) + synergie SEO
- Espérance gain 12 mois : +2 500 € stand-alone, +5 000 à +15 000 € avec valeur tunnel MCG
- Break-even attendu sous 6-9 mois

**Gotcha rencontré** :
- Hosting `https://files.alpha.cntri.cloud/` retourne 403 sur tout le dossier `audits/` (pas spécifique au nouveau fichier — bug nginx ou ACL à diagnostiquer hors mission)
- Ligne `centauri_resources` insérée avec URL prévue mais inaccessible tant que nginx pas réparé

**Next steps** :
- [ ] Greg envoie au vendeur la liste des 7 questions/documents (cession photos, sociaux, statut juridique, newsletter, hébergeur, licences plugins, compte WP.com Atomic)
- [ ] Greg fait l'offre 4 000 € avec clause de séquestre 30 % libéré à 60 jours
- [ ] Si vendeuse OK → signature + transferts contractuels
- [ ] Post-signature M+1 : kick-off Gauvain pour nettoyage Schema (11 review snippets duplicates) + activation AdSense + intégration MCG light (footer/popup)
- [ ] M+2 à M+3 : monitoring trafic + audit Ahrefs payant + sélection 5 pages à réécrire (Greg + Tristan)
- [ ] À M+3 : décision GO/NO-GO migration vers stack Centauri (Next.js + MDX + Vercel)
- [ ] Hors mission : diagnostic 403 nginx sur `files.alpha.cntri.cloud/audits/` (à confier à Yvain)

### 2026-05-28 — Session 2 (négociation finale + signature APA + red flags vendeur)

**Réalisé** :
- Négociation aboutie à **2 000 USD** (prix divisé par 9 vs listing initial 18K, par 2 vs 4K initial)
- Comparaison FlippaPay (1%) vs Escrow.com (2.78%) — choix Escrow.com pour 36 $ de protection supplémentaire
- APA v1 généré via Flippa APA Builder + signé : Schedule 1 enrichi (GA4/GSC, affiliation Greenweez/Fnty/Amazon, Cloudflare, WordPress.com Business, WP Rocket, Rank Math), 4 special provisions (inspection 7j, garantie data, transfert affiliation 7j, no-deletion), non-compete 24 mois, transition 1 mois × 3h/sem, gov. law France/Loire-Atlantique
- APA v2 régénéré (Pinterest typo corrigée, doublons social media + WordPress + hosting + email nettoyés)
- Audit mentions légales vegourmet.fr : SIRET absent, hébergeur incohérent (Automattic US déclaré mais texte dit UE), cookies non-conformes CNIL (consentement implicite), "données de santé" mentionnées par erreur, juridiction Dijon hors-sol, références obsolètes (LCEN datée 2014 au lieu 2004, Google+ cité)
- Audit profil vendeur Alexis BADET : empreinte numérique quasi nulle (pas LinkedIn, pas portfolio), "Chloé" est un persona fictif, vendeur expatrié Da Nang Vietnam (171 Bà Huyện Thanh Quan, +84 394 352 243), nom Flippa "Copywriter Strategy"

**Red flags identifiés** :
- **PayPal activé automatiquement à 12:50** par le vendeur, 14 min avant signature APA et alors qu'Escrow avait été convenu dans le chat — confirmé par audit Gmail timeline
- 3 baisses de prix successives (18K → 4K → 3K → 2.7K) avec pression "j'ai d'autres marques d'intérêt"
- Vendeur minimise la chute de trafic ("absence d'articles récents + saisonnalité") alors que l'audit V1 démontre une pénalité algorithmique (March 2026 Core Update)
- "Mon identité a été vérifiée par Flippa" — faux, Flippa ne fait pas de KYC sérieux côté vendeur
- IP signature au Vietnam (cohérent avec adresse déclarée mais à valider)

**Décisions** :
- APA v2 signé côté acheteur (closing 1er juin 2026), attente signature vendeur + bascule paiement PayPal → Escrow.com
- Ne PAS payer via PayPal sous aucun prétexte
- Maintenir la position Escrow ou retrait si refus
- Persona fictif Chloé : pas de problème juridique mais E-E-A-T à reconstruire post-acquisition

**Gotchas découverts** :
- Flippa autorise le vendeur à activer PayPal côté Deal Room sans confirmation acheteur — basculement silencieux du mode de paiement convenu
- Flippa APA Builder ne supprime pas le template du Schedule 1 : doublons inévitables si on ajoute des lignes (réseaux sociaux, WordPress, email)
- Mentions légales WordPress.com génériques contiennent données de santé et juridiction Dijon par défaut

**Next steps** :
- [ ] Attendre signature Alexis sur APA v2
- [ ] Vérifier bascule Escrow.com confirmée dans onglet Payments avant tout paiement
- [ ] Compléter KYC Escrow.com côté SARL Centauri
- [ ] Période inspection 7j post-funding : valider transfert GA4, GSC, WordPress, Cloudflare, Greenweez, Fnty, réseaux sociaux
- [ ] Post-acquisition : réécrire mentions légales (SIRET Centauri, adresse Nantes, hébergeur réel, cookies CNIL)

### 2026-05-29 — Session 3 (checklist transfert accès pré-closing)

**Réalisé** :
- Détection live de la stack complète vegourmet.fr (headers HTTP, `wp-json` namespaces, WHOIS, DNS) pour exhaustivité avant closing
- Confirmations live : registrar **Key-Systems GmbH** (back-end Automattic), expiration domaine **2026-11-04**, DNS **Cloudflare** (`kaiser`/`simone.ns.cloudflare.com`) + **APO actif**, hébergement WordPress.com Atomic
- Éléments NOUVEAUX non documentés avant : **boîte mail pro Titan** (MX `titan.email`, probable `contact@vegourmet.fr`), **Popup Maker PRO**, **Grow.me/Mediavine** (plugin `grow/v1` actif), **Newspack Blocks**, **Jetpack Boost**
- Plugins actifs confirmés via `wp-json` : jetpack (+boost/blaze/stats), wpcomsh, wp-table-builder, akismet, code-snippets, delicious-recipes, rankmath, popup-maker-pro, newspack-blocks, wp-rocket, grow, cookie-notice, wpforms ; thème yummy-bites-pro
- Création du document **`TRANSFERT-ACCES.md`** : checklist exhaustive en 9 blocs (domaine/DNS, hébergement/CMS, licences plugins, analytics/search, monétisation, réseaux sociaux, e-mail/newsletter, PI/contenu, admin/légal) + synthèse 9 accès P0 bloquants conditionnant le déblocage séquestre
- Création du document **`STACK.md`** : inventaire technique complet (architecture + plugins par namespace) + **estimation coûts annuels ~650 €/an** (fourchette 450–1 300 € selon plans Lite/Pro) + décision hébergement actée (pas de self-host, pilotage Claude via App Password/REST API, sandbox = staging WP.com + conteneur jetable alpha)
- Conseil hébergement : **ne pas auto-héberger WordPress** (double migration = double risque SEO + charge ops + surface d'attaque alpha) → garder WP.com jusqu'à migration directe Next.js à M+3. Économie post-migration : ~600 €/an

**Next steps** :
- [ ] Greg transmet `TRANSFERT-ACCES.md` (ou sa synthèse) au vendeur comme liste de hand-over à fournir pendant l'inspection 7j
- [ ] Vérifier chaque accès P0 reçu avant déblocage Escrow.com
- [ ] Anticiper renouvellement domaine (expiration 2026-11-04)

## Fichiers de la mission

| Fichier | Description |
|---|---|
| `LOG.md` | Ce fichier |
| `AUDIT-V1.md` | Source markdown du rapport |
| `TRANSFERT-ACCES.md` | Checklist exhaustive transfert des accès au closing (9 blocs + P0 bloquants) |
| `STACK.md` | Inventaire stack technique live + estimation coûts annuels (~650 €/an) + décision hébergement |
| `template.typ` | Template Typst dédié (charte Centauri navy + gold) |
| `output/audit-vegourmet-v1.pdf` | PDF final 34 pages |

## Historique

| Date | Changement |
|---|---|
| 2026-05-04 | Création mission + audit V1 + PDF généré + recalibrage prix 4 000 € + audit technique stack + plan migration Centauri Option B + tâche dashboard `DOC-CEN-20260504-0005` |
| 2026-05-28 | Négociation finale 2 000 USD + APA v1 + v2 signés + audit mentions légales + audit profil vendeur (Vietnam, persona fictif, red flags PayPal/Escrow) |
| 2026-05-29 | Détection live stack complète + création checklist transfert accès `TRANSFERT-ACCES.md` (Titan Email, Cloudflare APO, Popup Maker PRO, Grow.me/Mediavine confirmés) |
| 2026-05-29 | Création `STACK.md` : inventaire technique + estimation coûts annuels (~650 €/an, fourchette 450–1 300 €) + décision hébergement (pas de self-host, migration directe Next.js M+3, pilotage Claude REST API + sandbox jetable) |
