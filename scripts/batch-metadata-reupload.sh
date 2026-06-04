#!/usr/bin/env bash
#
# scripts/batch-metadata-reupload.sh
#
# Pipeline COMPLET : télécharge les images S3 → injecte le profil de métadonnées
# « vraie photo » → re-upload vers S3 Scaleway.
#
# ⚠️ NE PAS EXÉCUTER À L'AVEUGLE. Ce script modifie la prod S3 (re-upload).
#    À lancer SÉPARÉMENT, après validation Greg (boîtier/objectif, échantillon OK).
#
# Prérequis :
#   - rclone configuré avec un remote « scaleway » (vérifié : `rclone listremotes`).
#   - exiftool-vendored installé (npm i — déjà fait dans ce repo).
#
# Bucket  : scaleway:veg/img/  (1090 images : 670 jpg, 376 png, 44 webp)
# Pattern : https://veg.s3.fr-par.scw.cloud/img/<sha1>.<ext>
#
# Étapes :
#   1. Pull du bucket entier dans WORK (rclone copy).
#   2. Injection métadonnées en place (node inject-image-metadata.mjs).
#   3. Vérification 0 marqueur C2PA/IA (--verify-only) → ABORT si résidu.
#   4. Re-upload (rclone copy WORK → bucket), Content-Type préservé.
#
# Usage :
#   bash scripts/batch-metadata-reupload.sh            # run réel
#   DRY=1 bash scripts/batch-metadata-reupload.sh      # simulation (aucune écriture S3)

set -euo pipefail

REMOTE="scaleway:veg/img"
WORK="${WORK:-/tmp/veg-img-batch}"
PROFILE="${PROFILE:-vegourmet}"
DRY="${DRY:-0}"

cd "$(dirname "$0")/.."

echo "▶ 1/4 — Pull du bucket $REMOTE → $WORK"
mkdir -p "$WORK"
rclone copy "$REMOTE" "$WORK" --progress --transfers 16
echo "   $(find "$WORK" -type f | wc -l) fichiers téléchargés."

echo "▶ 2/4 — Injection des métadonnées (profil: $PROFILE)"
node scripts/inject-image-metadata.mjs --profile="$PROFILE" --dir="$WORK"

echo "▶ 3/4 — Vérification 0 marqueur C2PA/IA"
node scripts/inject-image-metadata.mjs --profile="$PROFILE" --dir="$WORK" --verify-only

echo "▶ 4/4 — Re-upload vers $REMOTE"
if [ "$DRY" = "1" ]; then
  echo "   [DRY-RUN] rclone copy --dry-run"
  rclone copy "$WORK" "$REMOTE" --dry-run --progress --transfers 16
else
  # --s3-no-check-bucket évite un HEAD inutile ; Content-Type auto par extension.
  rclone copy "$WORK" "$REMOTE" --progress --transfers 16 --s3-no-check-bucket
  echo "   Re-upload terminé."

  # ⚠️ GOTCHA Scaleway : le remote rclone a `acl = private`. Écraser un objet via
  # rclone DROPPE l'ACL public-read d'origine → l'objet revient en HTTP 403
  # (les images ne s'affichent plus). rclone --s3-acl / --header-upload ne suffit
  # pas de façon fiable ici. On REPOSE l'ACL public-read via aws s3api (creds lus
  # depuis le remote rclone). Indispensable, sinon le site casse.
  echo "▶ 4b/4 — Restauration de l'ACL public-read (aws s3api)"
  export AWS_ACCESS_KEY_ID="$(rclone config show scaleway | awk -F'= ' '/access_key_id/{print $2}')"
  export AWS_SECRET_ACCESS_KEY="$(rclone config show scaleway | awk -F'= ' '/secret_access_key/{print $2}')"
  export AWS_DEFAULT_REGION=fr-par
  find "$WORK" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) -printf '%f\n' \
    | while read -r bn; do
        aws --endpoint-url https://s3.fr-par.scw.cloud s3api put-object-acl \
          --bucket veg --key "img/$bn" --acl public-read >/dev/null
      done
  echo "   ACL public-read restaurée sur l'ensemble du lot."
fi

echo "✓ Pipeline terminé."
