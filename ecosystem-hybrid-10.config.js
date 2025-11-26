/**
 * PM2 Ecosystem Configuration - HYBRID Scanner (10 workers for testing)
 *
 * This configuration uses the hybrid worker system:
 * - 95% of batch scans use PHP fast scanner (0.5-1s)
 * - 5% of batch scans use Playwright deep scanner (8-15s)
 * - User-initiated scans always use Playwright
 */

module.exports = {
  apps: [
    {
      name: 'hybrid-worker',
      script: 'src/worker/index-hybrid-fixed.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 10, // 10 worker instances for testing
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      cwd: '/home/aiq/Asztal/10_M_USD/ai-security-scanner',
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
