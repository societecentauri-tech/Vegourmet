---
status: active
mission: vegourmet-acquisition
created: 2026-05-29
source: détection live (headers HTTP, wp-json namespaces, WHOIS, DNS) le 2026-05-29
---

# Stack technique vegourmet.fr & coûts annuels

> Inventaire confirmé en **live le 2026-05-29** (headers HTTP, `wp-json` namespaces, WHOIS, DNS). Sert de base au transfert (`TRANSFERT-ACCES.md`) et au calcul de rentabilité post-acquisition.

## Architecture

| Couche | Technologie | Détail |
|---|---|---|
| Hébergement | **WordPress.com Business** (Automattic Atomic) | `host-header: WordPress.com`, `x-ac: _atomic_ams`, `a8c-cdn` |
| CDN / proxy | **Cloudflare** + **APO** actif | NS `kaiser`/`simone.ns.cloudflare.com`, `cf-apo-via: tcache`, `cf-edge-cache: platform=wordpress` |
| Registrar domaine | **Key-Systems GmbH** (back-end Automattic) | `registrar@automattic.com`, expiration **2026-11-04** |
| E-mail | **Titan Email** | MX `mx1/mx2.titan.email` (probable `contact@vegourmet.fr`) |
| CMS | **WordPress** | REST API active `/wp-json/` |
| Thème | **Yummy Bites Pro** (WP Delicious) | `wp-content/themes/yummy-bites` |
| Sécurité | TLS 1.3 + HSTS 1 an + WAF double couche (Jetpack + Cloudflare) | CSP faible (`block-all-mixed-content` seul) |
| robots.txt | géré par **Cloudflare Managed Content** | bloque GPTBot, ClaudeBot, Google-Extended |

## Plugins actifs (confirmés via `wp-json` namespaces)

| Plugin | Namespace détecté | Type | Licence |
|---|---|---|---|
| **WP Rocket** 3.17.3.1 | `wp-rocket/v1` | Premium | clé wp-rocket.me |
| **Rank Math** (Pro probable) | `rankmath/v1` (+ ca/an/in/status) | Premium | compte Rank Math |
| **Delicious Recipes** | `deliciousrecipe/v1` | Premium (lié thème) | WP Delicious |
| **Popup Maker PRO** | `popup-maker-pro/v1`, `pum/v1` | Premium | clé Popup Maker |
| **WPForms** | (assets `wp-content/plugins/wpforms`) | Freemium | Lite vs Pro à confirmer |
| **WP Table Builder** | `wp-table-builder` | Freemium | Lite vs Pro à confirmer |
| **Cookie Notice** | (assets `wp-content/plugins/cookie-notice`) | Freemium | — |
| **Jetpack** (Backup/Protect/Boost/Stats/Blaze) | `jetpack/v4`, `jetpack-boost/v1`, `my-jetpack/v1` | Abonnement | inclus WP.com Business |
| **Akismet** | `akismet/v1` | Clé API | perso vs commercial |
| **Code Snippets** | `code-snippets/v1` | Gratuit | exporter les snippets |
| **Newspack Blocks** (Automattic) | `newspack-blocks/v1` | Gratuit | lié WP.com |
| **Grow.me / Mediavine** | `grow/v1` | Régie pub | commission, pas d'abonnement |
| WPCom Site Helper | `wpcomsh/v1`, `wpcom/v2`, `wpcom/v3` | Plateforme | Atomic |

## Estimation des coûts annuels récurrents

> Fourchettes : les plans exacts (Lite vs Pro) sont à confirmer via les **factures du vendeur** (cf. `TRANSFERT-ACCES.md` bloc 9). Prix de **renouvellement** annuel (≠ prix 1ʳᵉ année).

### Hébergement, domaine, e-mail, CDN

| Poste | Plan probable | Coût annuel |
|---|---|---|
| WordPress.com Business | requis pour plugins/SFTP | 250–300 € |
| Domaine `.fr` | standard | 12–15 € |
| Titan Email | 1 boîte pro | 0–36 € |
| Cloudflare APO | Free + add-on | 0–60 € |

### Licences thème & plugins (renouvellement)

| Logiciel | Coût annuel |
|---|---|
| Yummy Bites Pro | 35–45 € |
| WP Rocket | 49–55 € |
| Rank Math Pro | 55 € |
| Delicious Recipes Pro | 0–75 € (possiblement bundlé) |
| Popup Maker PRO | ~80 € |
| WPForms | 0–185 € (Lite probable) |
| WP Table Builder | 0–45 € (Lite probable) |
| Cookie Notice | 0 € |
| Akismet | 0–90 € |
| Jetpack | 0 € (inclus Business) |

### Monétisation & diffusion

| Poste | Coût annuel |
|---|---|
| Grow.me / Mediavine | 0 € (commission sur revenus) |
| Affiliations (Greenweez, Fnty, Amazon) | 0 € |
| Newsletter (Mailchimp/Brevo) | 0–100 € |

### Total

| Scénario | Coût annuel |
|---|---|
| Bas (Lite/inclus, renouvellements remisés) | **~450–550 €** |
| **Réaliste (médiane)** | **~600–750 €** |
| Haut (tout Pro plein tarif + add-ons) | **~1 100–1 300 €** |

**Estimation centrale retenue : ~650 €/an.**

## Impact migration Next.js (Option B, décision M+3)

Post-migration vers la stack Centauri (Next.js + MDX + Vercel + S3) : suppression de **toutes** les licences WP + plan WP.com.
- Économie récurrente : **~600 €/an** dès la coupure WP.com
- Coûts résiduels : domaine `.fr` (~15 €/an) + S3 marginal (Vercel inclus dans l'infra Centauri)

→ Argument supplémentaire pour migrer directement plutôt que de prolonger WordPress.

## Décision hébergement (actée 2026-05-29)

- **NE PAS auto-héberger WordPress** lors de la récupération (double migration = double risque SEO sur un site déjà sous pénalité Core Update ; charge ops ; surface d'attaque sur alpha).
- **M0** : transfert de propriété du site WP.com (pas de déménagement), zéro choc.
- **M+3** : décision GO/NO-GO migration **directe** vers Next.js (saute l'étape WP self-hosted).
- **Pilotage Claude** : Application Password sur la prod → REST API (`/wp-json/wp/v2/`), ou MCP WordPress, ou node n8n. Fonctionne aussi sur WP.com Business (ne justifie pas le self-host).
- **Sandbox** : staging WP.com natif (proche prod) + conteneur WP Docker jetable sur alpha en réseau interne (non exposé, risque sécu nul) pour les expérimentations libres.

## Historique

| Date | Changement |
|---|---|
| 2026-05-29 | Création — inventaire stack live + estimation coûts annuels (~650 €/an médiane) + décision hébergement (pas de self-host, migration directe Next.js à M+3) |
