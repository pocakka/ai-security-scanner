#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# POSTGRESQL OPTIMIZATION FOR HIGH-PERFORMANCE SCANNING
# ════════════════════════════════════════════════════════════════════
#
# Optimizes PostgreSQL for 300 concurrent workers
# Requires: i9 CPU + 128GB RAM
#
# Usage:
#   sudo ./optimize-postgres.sh
# ════════════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 POSTGRESQL PERFORMANCE OPTIMIZATION"
echo "════════════════════════════════════════════════════════════════════"
echo ""

POSTGRES_CONF="/etc/postgresql/15/main/postgresql.conf"

echo "📝 Backing up current config..."
cp $POSTGRES_CONF ${POSTGRES_CONF}.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

echo "⚙️  Applying optimizations..."

# Max connections for 300 workers
sed -i 's/^max_connections = .*/max_connections = 500/' $POSTGRES_CONF

# Shared buffers (25% of RAM = 32GB for 128GB RAM)
sed -i 's/^shared_buffers = .*/shared_buffers = 32GB/' $POSTGRES_CONF || echo "shared_buffers = 32GB" >> $POSTGRES_CONF

# Effective cache size (50% of RAM = 64GB)
sed -i 's/^effective_cache_size = .*/effective_cache_size = 64GB/' $POSTGRES_CONF || echo "effective_cache_size = 64GB" >> $POSTGRES_CONF

# Work mem (for sorting/hashing per query)
sed -i 's/^work_mem = .*/work_mem = 64MB/' $POSTGRES_CONF || echo "work_mem = 64MB" >> $POSTGRES_CONF

# Maintenance work mem (for VACUUM, CREATE INDEX)
sed -i 's/^maintenance_work_mem = .*/maintenance_work_mem = 2GB/' $POSTGRES_CONF || echo "maintenance_work_mem = 2GB" >> $POSTGRES_CONF

# WAL buffers
sed -i 's/^wal_buffers = .*/wal_buffers = 16MB/' $POSTGRES_CONF || echo "wal_buffers = 16MB" >> $POSTGRES_CONF

# Checkpoint settings (for write performance)
sed -i 's/^checkpoint_completion_target = .*/checkpoint_completion_target = 0.9/' $POSTGRES_CONF || echo "checkpoint_completion_target = 0.9" >> $POSTGRES_CONF

# Random page cost (for SSD)
sed -i 's/^random_page_cost = .*/random_page_cost = 1.1/' $POSTGRES_CONF || echo "random_page_cost = 1.1" >> $POSTGRES_CONF

# Effective IO concurrency (for SSD)
sed -i 's/^effective_io_concurrency = .*/effective_io_concurrency = 200/' $POSTGRES_CONF || echo "effective_io_concurrency = 200" >> $POSTGRES_CONF

# Max worker processes
sed -i 's/^max_worker_processes = .*/max_worker_processes = 16/' $POSTGRES_CONF || echo "max_worker_processes = 16" >> $POSTGRES_CONF

# Max parallel workers per gather
sed -i 's/^max_parallel_workers_per_gather = .*/max_parallel_workers_per_gather = 4/' $POSTGRES_CONF || echo "max_parallel_workers_per_gather = 4" >> $POSTGRES_CONF

# Max parallel workers
sed -i 's/^max_parallel_workers = .*/max_parallel_workers = 16/' $POSTGRES_CONF || echo "max_parallel_workers = 16" >> $POSTGRES_CONF

echo "✅ Optimizations applied"
echo ""

echo "📊 New settings:"
grep "^max_connections" $POSTGRES_CONF
grep "^shared_buffers" $POSTGRES_CONF
grep "^effective_cache_size" $POSTGRES_CONF
grep "^work_mem" $POSTGRES_CONF
echo ""

echo "🔄 Restarting PostgreSQL..."
systemctl restart postgresql@15-main
sleep 3

echo "✅ PostgreSQL restarted"
echo ""

echo "🔍 Verifying..."
sudo -u postgres psql -p 6432 -c "SHOW max_connections;"
sudo -u postgres psql -p 6432 -c "SHOW shared_buffers;"
echo ""

echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ OPTIMIZATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Max connections: 100 → 500"
echo "Shared buffers: default → 32GB"
echo "Effective cache: default → 64GB"
echo ""
echo "PostgreSQL is now optimized for high-performance scanning! 🚀"
echo "════════════════════════════════════════════════════════════════════"
