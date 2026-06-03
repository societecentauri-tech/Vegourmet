# Mission — DNS Cloudflare vegourmet.fr

> Slug : `dns-cloudflare-vegourmet` · Créée le 2026-06-03 · **Statut : CLÔTURÉE le 2026-06-03** (incident résolu, site UP). 2 suivis non bloquants reportés (« on verra plus tard ») : régénération token Infisical + nettoyage zone tiers.

## Description

Récupérer et authentifier la gestion DNS du domaine `vegourmet.fr` sous le compte Cloudflare Centauri. Le domaine est enregistré chez **WordPress.com** (registrar). Sa zone DNS était hébergée sur un **compte Cloudflare tiers** (NS `kaiser` / `simone`.ns.cloudflare.com). Cible : zone servie par le **compte Cloudflare Centauri** (NS `carmelo` / `marjory`.ns.cloudflare.com).

Incident : la bascule des NS vers le compte Centauri a mis le site **down** (Error 1000 / boucle proxy) car la zone Centauri avait été créée par un scan effectué *pendant que le proxy tiers était actif* → ses A apex pointaient sur des IP de proxy Cloudflare au lieu de l'origin WordPress.com. Corrigé le 2026-06-03.

Contexte acquisition : voir mémoire `project-vegourmet-acquisition`.

## Spécification

### Topologie des comptes Cloudflare

| Compte | Nameservers | Zone ID | Rôle |
|--------|-------------|---------|------|
| Tiers (accès récupéré par Victor) | `kaiser` / `simone` | — | ancien hôte, à nettoyer |
| **Centauri** (`Societe.centauri@gmail.com's Account`, account id `11183831…`) | `carmelo` / `marjory` | `06381be0576f5d5a51823c3f11ddbfa3` | **cible, sert depuis le 2026-06-03** |

### Stack du domaine
- **Site web** : WordPress.com (origin réel `192.0.78.210` + `192.0.78.157`)
- **Email (boîtes)** : Titan Email (`mx1/mx2.titan.email`)
- **Emailing** : Mailchimp (DKIM `k2`/`k3` → `dkim2/3.mcsv.net`)
- **Mails transactionnels** : WordPress.com (DKIM `wpcloud1/2`)

## Configuration

### Config DNS cible (= état final appliqué dans la zone Centauri)

| Type | Nom | Valeur | Proxy | Prio |
|------|-----|--------|-------|------|
| A | `@` | `192.0.78.210` | proxied | — |
| A | `@` | `192.0.78.157` | proxied | — |
| CNAME | `www` | `vegourmet.fr` | proxied | — |
| MX | `@` | `mx1.titan.email` | — | 10 |
| MX | `@` | `mx2.titan.email` | — | 20 |
| TXT | `@` | `v=spf1 include:_spf.wpcloud.com include:spf.titan.email ~all` | — | — |
| TXT | `_dmarc` | `v=DMARC1;p=none;` | — | — |
| CNAME | `k2._domainkey` | `dkim2.mcsv.net` | DNS only | — |
| CNAME | `k3._domainkey` | `dkim3.mcsv.net` | DNS only | — |
| CNAME | `wpcloud1._domainkey` | `wpcloud1._domainkey.wpcloud.com` | DNS only | — |
| CNAME | `wpcloud2._domainkey` | `wpcloud2._domainkey.wpcloud.com` | DNS only | — |

Pas d'AAAA réel (les AAAA `2606:4700::` étaient des artefacts proxy). NS `ns1/2/3.wordpress.com` dans l'ancienne zone tiers = vestiges inertes.

Mode SSL/TLS de la zone Centauri : `full` (correct pour origin WordPress.com).

## Implémentation

### Correctif appliqué (2026-06-03, via API Cloudflare, Global API Key)
Script : `/tmp/cf_fix_vegourmet.py` (idempotent). Actions sur zone `06381be0…` :
- Supprimé 3× A apex `104.26.1.4` / `104.26.0.4` / `172.67.68.229` (IP proxy → boucle)
- Supprimé 3× A `www` (mêmes IP) + 6× AAAA apex/www (`2606:4700::`)
- Créé A `@` → `192.0.78.210` et `192.0.78.157` (proxied)
- Créé CNAME `www` → `vegourmet.fr` (proxied)
- Créé CNAME `wpcloud1._domainkey` et `wpcloud2._domainkey` (DNS only)
- Inchangés : MX Titan, SPF, DMARC, DKIM `k2`/`k3`

Résultat : 18 → 11 records propres.

### Reste à faire (facultatif / hygiène)
1. Nettoyer / supprimer la zone `vegourmet.fr` dans le compte Cloudflare tiers (plus utilisée).
2. Vérifier dans WordPress.com que les NS du domaine sont bien figés sur `carmelo` / `marjory`.

### Dette sécurité (P2)
- ⚠️ Le secret `CLOUDFLARE_API_TOKEN` dans Infisical `/_shared/cloudflare` (env prod) est **INVALIDE** (API `code 1000 Invalid API Token`). Seule la **Global API Key** + email `societe.centauri@gmail.com` fonctionne. → Régénérer un token scopé (Zone.DNS Edit) et le mettre à jour dans Infisical ; éviter de dépendre de la Global Key full-account.

## Tests

| Test | Résultat (2026-06-03) |
|------|------------------------|
| `dig vegourmet.fr NS` | `carmelo` / `marjory` ✅ |
| `curl -I https://vegourmet.fr` | HTTP 200, servi WordPress.com ✅ |
| `curl -I https://www.vegourmet.fr` | 301 → apex ✅ |
| A apex (proxy) | `188.114.97.2` / `188.114.96.2` ✅ |
| Email (MX/SPF/DMARC/DKIM) | intacts ✅ |

## Historique

- 2026-06-03 : Récupération config DNS réelle (compte tiers, snapshot `/home/greg/vegourmet-dns-COMPLET.txt`). Découverte zone Centauri pré-existante mal configurée (A apex = IP proxy) → site down après bascule NS. Correctif API appliqué, site remonté (HTTP 200). Token Infisical détecté invalide. Création de la mission.
- 2026-06-03 : **Mission CLÔTURÉE** par Victor. Incident résolu, site UP. Suivis token + nettoyage zone tiers reportés à plus tard (non bloquants).
