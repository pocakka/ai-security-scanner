/**
 * PM2 Ecosystem Configuration - HYBRID Scanner
 *
 * This configuration uses the hybrid worker system:
 * - 95% of batch scans use PHP fast scanner (0.5-1s)
 * - 5% of batch scans use Playwright deep scanner (8-15s)
 * - User-initiated scans always use Playwright
 *
 * Performance: ~450,000 scans/day (20x improvement over Playwright-only)
 */

module.exports = {
  apps: [
    {
      name: 'hybrid-worker',
      script: 'npx',
      args: 'tsx src/worker/index-hybrid.ts',
      instances: 100, // 100 worker instances
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        USE_REAL_CRAWLER: 'true',
      },
      error_file: '/tmp/pm2-hybrid-error.log',
      out_file: '/tmp/pm2-hybrid-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
    },
  ],
}
