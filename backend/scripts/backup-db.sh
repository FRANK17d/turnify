#!/bin/bash
# Backup script for Turnify PostgreSQL Database

# Configuration
CONTAINER_NAME="turnify-postgres"
DB_USER="postgres"
DB_NAME="turnify"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/turnify_backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup for $DB_NAME..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $FILENAME

if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $FILENAME"
  
  # Optional: Delete backups older than 7 days
  # find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -exec rm {} \;
else
  echo "❌ Backup failed!"
  exit 1
fi
