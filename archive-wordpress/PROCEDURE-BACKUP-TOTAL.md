# Procédure — Sauvegarde TOTALE vegourmet.fr

> Objectif : disposer d'une sauvegarde **complète et possédée** (hors WordPress.com), restaurable, du site `vegourmet.fr` (WordPress.com Business / Atomic, site ID `238549663`).

Un backup total = **4 composants**. Les composants 1-2 sont récupérables à distance ; les 3-4 exigent les accès SSH/SFTP WordPress.com.

## Composant 1 — Contenu structuré (FAIT, via REST)

Export REST `/wp-json/wp/v2` → `content/*.json` + `manifests/`.
Couvre : recettes, articles, pages, catégories, équipements, commentaires, manifeste médias.
**Limite** : ne contient PAS les `postmeta` structurés ni `wp_options` (→ composant 3).

Script de régénération : voir `alpha:/home/greg/backups/vegourmet/<date>/` (pull paginé REST).

## Composant 2 — Binaires médias (FAIT, via URLs publiques)

1367 fichiers originaux téléchargés depuis `source_url` → `alpha:.../media/files/` (~614 Mo).
Stockés sur alpha + poussés sur S3. Hors git (trop volumineux).

## Composant 3 — Dump base de données (via SSH WordPress.com)

WordPress.com Business expose **WP-CLI via SSH**. Le dump SQL capture TOUT : posts, postmeta (recettes Delicious complètes), `wp_options` (réglages Rank Math / WP Rocket / Popup Maker / Grow.me), tables custom plugins, utilisateurs, commentaires.

```bash
# Connexion (username depuis WP.com → Hosting Configuration)
SSH_USER="<username_wpcom>"          # ex: vegourmetfr.XXXXXX
SSH_HOST="sftp.wp.com"
KEY=/home/greg/.ssh/vegourmet_wpcom_ed25519   # clé privée (aussi dans Infisical /apps/vegourmet-prod)

# Dump SQL complet via WP-CLI distant
ssh -i $KEY ${SSH_USER}@${SSH_HOST} "wp db export --single-transaction --default-character-set=utf8mb4 - " \
  | gzip > db/vegourmet-db-$(date +%F).sql.gz

# (alternative si wp db export indisponible : mysqldump via les creds DB du Hosting Config)
```

## Composant 4 — Archive fichiers `wp-content` (via SFTP/SSH)

Récupère thème (Yummy Bites Pro), plugins premium (WP Rocket, Rank Math, Popup Maker Pro, WP Delicious Pro), mu-plugins, et `uploads/` (médias + variantes générées).

```bash
# Option A — tar distant puis rapatriement (rapide)
ssh -i $KEY ${SSH_USER}@${SSH_HOST} "tar czf - -C htdocs/wp-content ." \
  > files/wp-content-$(date +%F).tar.gz

# Option B — miroir SFTP incrémental
sftp -i $KEY ${SSH_USER}@${SSH_HOST}
#   get -r htdocs/wp-content  files/wp-content/
```

> Le chemin racine WordPress.com Atomic est généralement `htdocs/` (à confirmer une fois connecté : `ssh ... "pwd && ls"`).

## Accès SSH

- **Clé privée** : `alpha:/home/greg/.ssh/vegourmet_wpcom_ed25519` (chmod 600)
- **Backup clé** : Infisical projet `_infra/alpha` → `/apps/vegourmet-prod` →
  `WPCOM_SSH_PRIVATE_KEY` / `WPCOM_SSH_PUBLIC_KEY` / `WPCOM_SSH_KEY_FINGERPRINT`
- **Clé publique installée** côté WordPress.com le 2026-06-03
- **Username SSH** : à lire dans WP.com → Hosting Configuration (à documenter ici une fois récupéré)

## Filet de sécurité permanent (côté Automattic)

**Jetpack VaultPress Backup** (inclus dans le plan Business) tourne en continu : sauvegarde temps-réel off-site, restauration point-in-time depuis `wordpress.com/backup/vegourmet.fr`. C'est la sauvegarde « managée » — complémentaire de cette archive possédée, pas un substitut.

## Stockage des sauvegardes possédées

| Composant | alpha | S3 | git |
|---|---|---|---|
| Contenu JSON | ✅ | ✅ | ✅ (ce repo) |
| Médias binaires (~614 Mo) | ✅ | ✅ | ❌ |
| Dump SQL | ✅ | ✅ | ❌ |
| Archive wp-content | ✅ | ✅ | ❌ |

## Cadence recommandée

- **Maintenant** : backup total one-shot (les 4 composants) avant toute intervention.
- **Avant chaque intervention** (fix Schema, mentions légales, etc.) : dump SQL + snapshot contenu.
- **Mensuel** tant que le site reste sur WordPress.com, jusqu'à la migration Next.js (M+3).
