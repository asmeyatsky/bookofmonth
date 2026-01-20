#!/bin/bash
# Database backup script for Book of the Month
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-bookofmonth}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${DB_HOST:-db}"

# S3 configuration (optional)
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
S3_PREFIX="${S3_BACKUP_PREFIX:-backups/database}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Perform backup
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.dump"
echo "Creating backup: $BACKUP_FILE"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -Fc \
    --no-owner \
    --no-acl \
    "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Calculate checksum
CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
echo "$CHECKSUM" > "${BACKUP_FILE}.sha256"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/"
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/"
    aws s3 cp "${BACKUP_FILE}.sha256" "s3://${S3_BUCKET}/${S3_PREFIX}/"
fi

# Remove old local backups
echo "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.dump.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*.sha256" -mtime +$RETENTION_DAYS -delete

# Summary
echo ""
echo "=== Backup Summary ==="
echo "File: $(basename $BACKUP_FILE)"
echo "Size: $BACKUP_SIZE"
echo "Checksum: $CHECKSUM"
echo "Completed at: $(date)"
echo "======================"

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.dump.gz" | wc -l)
echo "Total backups retained: $BACKUP_COUNT"
