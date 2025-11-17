# Database Scaling Guide

## 📊 Current vs. Production Database

### ⚠️ **Current Setup (Development)**

```
Database: SQLite (file:./dev.db)
Capacity: ~100K scans
Concurrent: 1 writer at a time
Indexes: Minimal
JSON: Stored as TEXT
```

**Issues at 1M+ scans:**
- ❌ Database locked errors with multiple workers
- ❌ Slow queries (no indexes on url, domain, status)
- ❌ Cannot query JSON fields
- ❌ Single file grows to 50GB+
- ❌ Backup requires downtime
- ❌ Cannot scale horizontally

---

### ✅ **Production Setup (Recommended)**

```
Database: PostgreSQL 15+
Capacity: 10M+ scans easily
Concurrent: Unlimited readers/writers
Indexes: 15+ optimized indexes
JSON: Native JSONB (queryable!)
```

**Benefits:**
- ✅ Multiple workers simultaneously
- ✅ Fast queries (< 100ms even at 10M scans)
- ✅ Query JSON fields directly
- ✅ Hot backups (pg_dump)
- ✅ Horizontal scaling (read replicas)
- ✅ Advanced features (partitioning, full-text search)

---

## 🚀 Migration to PostgreSQL

### **Step 1: Install PostgreSQL**

#### **Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

#### **Docker (easiest for testing):**
```bash
docker run --name postgres-prod \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ai_security_scanner \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  -d postgres:15
```

---

### **Step 2: Create Production Database**

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE ai_security_scanner;

# Create user
CREATE USER scanner WITH PASSWORD 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_security_scanner TO scanner;

# Connect to the database
\c ai_security_scanner

# Grant schema privileges
GRANT ALL ON SCHEMA public TO scanner;

# Exit
\q
```

---

### **Step 3: Update Environment Variables**

**Local development (`.env.local`):**
```env
# SQLite for local dev (fast, simple)
DATABASE_URL="file:./dev.db"
```

**Production (`.env.production`):**
```env
# PostgreSQL for production (scalable)
DATABASE_URL="postgresql://scanner:strong_password_here@localhost:5432/ai_security_scanner"

# Or with connection pooling (recommended)
DATABASE_URL="postgresql://scanner:strong_password_here@localhost:5432/ai_security_scanner?connection_limit=20&pool_timeout=10"
```

---

### **Step 4: Switch to Production Schema**

```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema.sqlite.backup

# Use production schema
cp prisma/schema.production.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run migration (creates tables + indexes)
npx prisma migrate dev --name init_postgresql
```

---

### **Step 5: Migrate Existing Data (Optional)**

If you have important scans in SQLite:

```bash
# Export from SQLite
npm run export-scans > scans-backup.json

# Import to PostgreSQL
npm run import-scans < scans-backup.json
```

Or use migration script:

```typescript
// scripts/migrate-sqlite-to-postgres.ts
import { PrismaClient as SQLiteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./dev.db' } }
})

const postgres = new PostgresClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function migrate() {
  console.log('📦 Fetching scans from SQLite...')
  const scans = await sqlite.scan.findMany()

  console.log(`🚀 Migrating ${scans.length} scans to PostgreSQL...`)

  for (const scan of scans) {
    await postgres.scan.create({
      data: {
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        status: scan.status,
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        // Parse JSON strings to objects
        detectedTech: scan.detectedTech ? JSON.parse(scan.detectedTech) : null,
        findings: scan.findings ? JSON.parse(scan.findings) : null,
        metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
        createdAt: scan.createdAt,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
      }
    })
  }

  console.log('✅ Migration complete!')
}

migrate().catch(console.error)
```

---

## 📈 Performance Optimizations

### **1. Proper Indexing (Already in schema.production.prisma)**

```prisma
model Scan {
  // ...fields...

  @@index([url])                    // Search by URL
  @@index([domain])                 // Search by domain
  @@index([status])                 // Filter by status
  @@index([createdAt])              // Sort by date
  @@index([status, createdAt])      // Combined queries
  @@index([riskLevel, riskScore])   // Risk filtering
  @@index([domain, createdAt])      // Domain timeline
}
```

**Impact:**
- Query time: 5 seconds → 50ms (100× faster!)

---

### **2. JSON Queries (PostgreSQL JSONB)**

**Before (SQLite):**
```typescript
// Can't query JSON fields!
// Have to fetch all and filter in JavaScript
const scans = await prisma.scan.findMany()
const openAIScans = scans.filter(s =>
  JSON.parse(s.detectedTech || '{}').provider === 'OpenAI'
)
```

**After (PostgreSQL):**
```typescript
// Direct JSON queries!
const openAIScans = await prisma.$queryRaw`
  SELECT * FROM "Scan"
  WHERE "detectedTech"->>'provider' = 'OpenAI'
`

// Or with Prisma JSON filter (upcoming feature)
const openAIScans = await prisma.scan.findMany({
  where: {
    detectedTech: {
      path: ['provider'],
      equals: 'OpenAI'
    }
  }
})
```

---

### **3. Connection Pooling**

**Update DATABASE_URL:**
```env
# Without pooling (max 10 connections)
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# With pooling (recommended for production)
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=10"
```

**Or use external pooler (PgBouncer):**
```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
ai_security_scanner = host=localhost port=5432 dbname=ai_security_scanner

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20

# Use pooler in connection string
DATABASE_URL="postgresql://user:pass@localhost:6432/ai_security_scanner"
```

---

### **4. Data Archival Strategy**

**Automatically archive old scans (> 1 year):**

```typescript
// scripts/archive-old-scans.ts
import { prisma } from '@/lib/db'

async function archiveOldScans() {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  console.log(`🗄️  Archiving scans older than ${oneYearAgo.toISOString()}...`)

  // Move to archive table
  const oldScans = await prisma.scan.findMany({
    where: {
      createdAt: { lt: oneYearAgo },
      status: 'COMPLETED'
    }
  })

  console.log(`📦 Found ${oldScans.length} scans to archive`)

  for (const scan of oldScans) {
    // Copy to archive
    await prisma.scanArchive.create({
      data: {
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        status: scan.status,
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        detectedTech: scan.detectedTech,
        findings: scan.findings,
        metadata: scan.metadata,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
      }
    })

    // Delete from main table
    await prisma.scan.delete({ where: { id: scan.id } })
  }

  console.log('✅ Archival complete!')
}

// Run monthly via cron
archiveOldScans().catch(console.error)
```

**Add to crontab (monthly):**
```bash
# Run on 1st day of month at 2am
0 2 1 * * cd /var/www/ai-security-scanner && npm run archive-scans
```

---

### **5. Query Optimization Patterns**

#### **Pagination (offset-based):**
```typescript
// ✅ Good for small offsets (< 10,000)
const scans = await prisma.scan.findMany({
  take: 50,
  skip: offset,
  orderBy: { createdAt: 'desc' }
})
```

#### **Cursor-based pagination (better for large datasets):**
```typescript
// ✅ Better for large offsets (100,000+)
const scans = await prisma.scan.findMany({
  take: 50,
  cursor: lastScanId ? { id: lastScanId } : undefined,
  skip: lastScanId ? 1 : 0,
  orderBy: { createdAt: 'desc' }
})
```

#### **Aggregations (count, avg, etc.):**
```typescript
// Count by risk level (fast with indexes)
const stats = await prisma.scan.groupBy({
  by: ['riskLevel'],
  _count: true,
  where: {
    status: 'COMPLETED',
    createdAt: { gte: last30Days }
  }
})

// Result: { LOW: 1500, MEDIUM: 800, HIGH: 200, CRITICAL: 50 }
```

---

### **6. Database Partitioning (Advanced - 10M+ scans)**

**Partition by date (PostgreSQL 10+):**

```sql
-- Create partitioned table
CREATE TABLE "Scan_partitioned" (
  LIKE "Scan" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

-- Create monthly partitions
CREATE TABLE "Scan_2024_01" PARTITION OF "Scan_partitioned"
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE "Scan_2024_02" PARTITION OF "Scan_partitioned"
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create future partitions via pg_partman extension
```

**Benefits:**
- Queries only scan relevant partitions (faster)
- Easy to drop old partitions (instant archival)
- Better maintenance (VACUUM, ANALYZE per partition)

---

## 📊 Monitoring & Metrics

### **1. Query Performance**

```sql
-- Slow queries (> 1 second)
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### **2. Table Sizes**

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **3. Index Usage**

```sql
-- Unused indexes (consider dropping)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

---

## 🎯 Capacity Planning

### **Database Size Estimates:**

| Scans | Storage | RAM (recommended) | CPU |
|-------|---------|-------------------|-----|
| 100K | 5 GB | 2 GB | 2 cores |
| 1M | 50 GB | 4 GB | 2-4 cores |
| 10M | 500 GB | 8-16 GB | 4-8 cores |
| 100M | 5 TB | 32+ GB | 8+ cores |

**Storage breakdown per scan:**
- Scan row: ~2 KB
- detectedTech JSON: ~1 KB
- findings JSON: ~10-30 KB (varies by findings count)
- metadata JSON: ~5 KB
- AiTrustScorecard: ~1 KB
- **Total: ~20-40 KB per scan**

**10M scans × 30 KB = ~300 GB** (+ indexes ~100 GB = **400 GB total**)

---

## 🔐 Backup Strategy

### **1. Automated Backups**

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/var/backups/ai-scanner"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scan_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database (compressed)
pg_dump -U scanner -d ai_security_scanner | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup saved: $BACKUP_FILE"
```

**Crontab (daily at 3am):**
```bash
0 3 * * * /var/www/ai-security-scanner/scripts/backup-database.sh
```

### **2. Point-in-Time Recovery (PITR)**

```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

---

## 🚨 Troubleshooting

### **"Database locked" errors:**
→ Switch to PostgreSQL (SQLite can't handle concurrent writes)

### **Slow queries after 1M scans:**
→ Run `ANALYZE` to update statistics
→ Check missing indexes with query planner

### **Out of memory:**
→ Increase `work_mem` in postgresql.conf
→ Use cursor-based pagination instead of offset

### **Connection pool exhausted:**
→ Increase `connection_limit` in DATABASE_URL
→ Use PgBouncer for connection pooling

---

## 📚 Additional Resources

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PgBouncer Setup](https://www.pgbouncer.org/)
- [Database Partitioning Guide](https://www.postgresql.org/docs/current/ddl-partitioning.html)

---

**Last Updated:** 2025-11-17
**Version:** 1.0
