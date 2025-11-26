module.exports = {
  apps: [
    {
      name: 'analyzer-worker',
      script: 'npx',
      args: 'tsx src/worker/index-sqlite.ts',
      instances: 50,  // CSÖKKENTVE 300-ről 50-re (kevesebb CPU load)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner',
        QUEUE_DB_PATH: './data/queue.db',
        MAX_WORKERS: '50',
        USE_REAL_CRAWLER: 'true',
        RATE_LIMIT_MS: '100'  // 100ms rate limit (gyorsabb mint 1000ms)
      },
      max_memory_restart: '500M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,

      // PERFORMANCE OPTIMIZATION
      node_args: '--max-old-space-size=400'  // Limit memory per worker
    }
  ]
}
