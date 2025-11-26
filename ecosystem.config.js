module.exports = {
  apps: [{
    name: 'analyzer-worker',
    script: 'npx',
    args: 'tsx src/worker/index-sqlite.ts',
    instances: 300,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MAX_WORKERS: '300',
      DATABASE_URL: 'postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner'
    },
    max_memory_restart: '500M',
    error_file: '/home/aiq/.pm2/logs/analyzer-worker-error.log',
    out_file: '/home/aiq/.pm2/logs/analyzer-worker-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false
  }]
}
