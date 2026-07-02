#!/usr/bin/env bash
# Daily PostgreSQL backup -> Cloudflare R2 (off-box, so a dead VM never loses
# both the app AND its backups). Requires the AWS CLI on the VM only as an
# S3-compatible client; the backup target is Cloudflare R2.
#
# Schedule with:  crontab -e
#   0 3 * * * /home/ubuntu/SWP391-horse-racing-tournament-system/infra/backup-db.sh >> /var/log/hrts-backup.log 2>&1
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# Load DB + R2 credentials from the same env file compose uses.
set -a; . infra/.env.prod; set +a

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/tmp/hrts-${STAMP}.sql.gz"

# pg_dump inside the running Postgres container, gzipped on the way out.
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod \
  exec -T postgres pg_dump -U "$DB_USERNAME" "$DB_NAME" | gzip > "$DUMP"

# Upload to R2 via the S3-compatible endpoint. AWS_* env names are required by
# the AWS CLI even when the endpoint is Cloudflare R2.
AWS_ACCESS_KEY_ID="$OBJECT_STORAGE_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$OBJECT_STORAGE_SECRET_KEY" \
aws s3 cp "$DUMP" "s3://${OBJECT_STORAGE_BUCKET}/db-backups/hrts-${STAMP}.sql.gz" \
  --endpoint-url "$OBJECT_STORAGE_ENDPOINT" --region "$OBJECT_STORAGE_REGION"

rm -f "$DUMP"
echo "backup ok: db-backups/hrts-${STAMP}.sql.gz"
