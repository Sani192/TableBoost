#!/bin/bash

# TableBoost - Database Restore Script
# Usage: ./restore.sh <backup_file_path>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file_path>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

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

echo "WARNING: This will drop the existing database schema and restore from '$BACKUP_FILE'."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore aborted."
    exit 1
fi

echo "Starting database restore..."

# Drop the schema to ensure a clean slate, then restore.
# (This assumes the public schema is used)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" -f "$BACKUP_FILE"

echo "Restore completed successfully!"
