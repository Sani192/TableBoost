#!/bin/bash

# TableBoost - Database Backup Script
# Usage: ./backup.sh

set -e

# Load environment variables
if [ -f "backend/.env" ]; then
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "Error: backend/.env file not found."
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set in backend/.env"
    exit 1
fi

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tableboost_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
pg_dump "$DATABASE_URL" -F p -f "$BACKUP_FILE"

echo "Backup completed successfully!"
echo "Backup saved to: $BACKUP_FILE"
