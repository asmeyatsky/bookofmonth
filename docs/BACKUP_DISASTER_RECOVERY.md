# Backup and Disaster Recovery Plan

## Overview

This document outlines the backup and disaster recovery procedures for the Book of the Month application.

## Backup Strategy

### Database Backups (PostgreSQL)

#### Automated Daily Backups

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/scripts/backup_database.sh
```

#### Backup Script (`scripts/backup_database.sh`)

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-bookofmonth}"
DB_USER="${POSTGRES_USER:-postgres}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h db -U $DB_USER -Fc $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Compress backup
gzip "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Remove old backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.dump.gz" s3://your-bucket/backups/

echo "Backup completed: backup_$TIMESTAMP.dump.gz"
```

#### Manual Backup

```bash
# From host machine
docker exec -t bookofmonth_db_1 pg_dump -U postgres bookofmonth > backup.sql

# With compression
docker exec -t bookofmonth_db_1 pg_dump -U postgres -Fc bookofmonth > backup.dump
```

### Redis Backups

Redis is configured with AOF (Append Only File) persistence:

```bash
# Trigger manual save
docker exec bookofmonth_redis_1 redis-cli -a $REDIS_PASSWORD BGSAVE

# Copy RDB file
docker cp bookofmonth_redis_1:/data/dump.rdb ./backup/redis_backup.rdb
```

### Media and Static Files

```bash
# Backup media files
tar -czvf media_backup_$(date +%Y%m%d).tar.gz /app/media/

# Backup static files (if not in container)
tar -czvf static_backup_$(date +%Y%m%d).tar.gz /app/staticfiles/
```

## Recovery Procedures

### Database Recovery

#### Full Recovery from Backup

```bash
# Stop application
docker-compose stop web celery celery-beat

# Restore database
docker exec -i bookofmonth_db_1 pg_restore -U postgres -d bookofmonth -c < backup.dump

# Alternatively for SQL dump
docker exec -i bookofmonth_db_1 psql -U postgres -d bookofmonth < backup.sql

# Restart application
docker-compose start web celery celery-beat
```

#### Point-in-Time Recovery

1. Configure WAL archiving in PostgreSQL
2. Use pg_basebackup for base backups
3. Apply WAL logs to recover to specific point

### Redis Recovery

```bash
# Stop Redis
docker-compose stop redis

# Replace RDB file
docker cp backup/redis_backup.rdb bookofmonth_redis_1:/data/dump.rdb

# Start Redis
docker-compose start redis
```

### Full System Recovery

1. **Provision new infrastructure**
   - Set up new servers/containers
   - Configure networking and security groups

2. **Restore data**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd bookofmonth

   # Set up environment
   cp .env.production .env
   # Edit .env with correct values

   # Start services
   docker-compose up -d

   # Restore database
   docker exec -i bookofmonth_db_1 pg_restore -U postgres -d bookofmonth < backup.dump
   ```

3. **Verify restoration**
   - Run health checks
   - Verify data integrity
   - Test critical functionality

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Target**: 4 hours
- **Maximum acceptable**: 8 hours

### Recovery Point Objective (RPO)

- **Target**: 1 hour (with hourly backups)
- **Current**: 24 hours (with daily backups)

### Disaster Scenarios

#### Scenario 1: Database Corruption

1. Stop application services
2. Restore from latest backup
3. Apply any available transaction logs
4. Restart services
5. Verify data integrity

#### Scenario 2: Complete Server Failure

1. Provision new server
2. Deploy from Docker images
3. Restore database from backup
4. Restore Redis from RDB
5. Update DNS if needed
6. Verify all services

#### Scenario 3: Data Center Outage

1. Activate secondary region (if multi-region)
2. Update DNS to failover
3. Verify service functionality
4. Monitor for primary recovery

### Communication Plan

1. **Detection**: Automated monitoring alerts
2. **Assessment**: On-call engineer evaluates severity
3. **Escalation**: Notify stakeholders within 15 minutes
4. **Updates**: Status updates every 30 minutes
5. **Resolution**: Post-incident report within 24 hours

## Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Database Full | Daily | 30 days | S3/Local |
| Database WAL | Continuous | 7 days | S3/Local |
| Redis RDB | Daily | 7 days | Local |
| Media Files | Weekly | 90 days | S3 |
| Configuration | On change | Indefinite | Git |

## Testing

### Monthly Backup Verification

1. Restore backup to test environment
2. Run data integrity checks
3. Test application functionality
4. Document results

### Quarterly DR Drill

1. Simulate failure scenario
2. Execute recovery procedures
3. Measure RTO/RPO
4. Update procedures based on findings

## Monitoring

Set up alerts for:
- Backup job failures
- Backup age > 24 hours
- Storage capacity < 20%
- Database replication lag

## Contact Information

| Role | Contact |
|------|---------|
| Primary On-Call | [Contact Info] |
| Secondary On-Call | [Contact Info] |
| Database Admin | [Contact Info] |
| Infrastructure Lead | [Contact Info] |
