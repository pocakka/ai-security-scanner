/**
 * PM2 Configuration - AI BATCH MODE (Optimized)
 *
 * CRITICAL: This is for BATCH TERMINAL scanning ONLY!
 * UI scanning uses ecosystem-optimized.config.js (unchanged!)
 *
 * OPTIMIZATIONS:
 * - PHP crawler (80ms vs 3700ms)
 * - No reconnaissance, admin, port scan, DNS, compliance, WAF, MFA
 * - 3.3s/scan vs 22s/scan = 6.7x faster
 *
 * USAGE:
 *   pm2 start ecosystem-ai-batch.config.js
 *   python3 scripts/parallel-scanner.py domains.txt
 */

module.exports = {
  apps: [
    {
      name: 'ai-batch-worker',
      script: 'npx',
      args: 'tsx src/worker/index-ai-batch.ts',
      instances: 100,  // 2x more workers (because 6.7x faster!)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner',
        QUEUE_DB_PATH: './data/queue.db',
        MAX_WORKERS: '100',
        RATE_LIMIT_MS: '50',  // Faster rate limit (50ms vs 100ms)

        // AI Batch flags
        AI_BATCH_MODE: 'true',
        USE_PHP_CRAWLER: 'true',
      },
      max_memory_restart: '400M',  // Less memory needed (no Playwright!)
      error_file: './logs/ai-batch-error.log',
      out_file: './logs/ai-batch-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,  // Faster restart (2s vs 4s)
      kill_timeout: 3000,   // Faster kill (3s vs 5s)

      // Performance optimization
      node_args: '--max-old-space-size=300'  // Less memory (no browser!)
    }
  ]
}
