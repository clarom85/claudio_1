/**
 * PM2 ecosystem config
 * Il scheduler gira ogni ora come cron job PM2
 */
export default {
  apps: [
    {
      name: 'content-scheduler',
      script: 'packages/scheduler/src/index.js',
      cron_restart: '0 * * * *',   // ogni ora
      watch: false,
      autorestart: false,           // cron job, non daemon
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/content-network/scheduler-error.log',
      out_file: '/var/log/content-network/scheduler-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'email-api',
      script: 'packages/email-api/src/index.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/content-network/email-api-error.log',
      out_file: '/var/log/content-network/email-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'health-check',
      script: 'packages/vps/src/health-check.js',
      cron_restart: '*/15 * * * *',  // ogni 15 minuti
      watch: false,
      autorestart: false,            // cron job
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/content-network/health-check-error.log',
      out_file: '/var/log/content-network/health-check-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    // ── Niche Guardians ──────────────────────────────────────────────────────
    // Un agent dedicato per nicchia: monitoring, SEO auto-fix, pipeline health.
    // Aggiungi una entry per ogni nuova nicchia spawned.
    {
      name: 'chip',   // CHIP — home-improvement-costs guardian
      script: 'packages/vps/src/niche-guardian.js',
      args: '--niche home-improvement-costs',
      cron_restart: '*/30 * * * *',  // ogni 30 minuti
      watch: false,
      autorestart: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/content-network/chip-error.log',
      out_file: '/var/log/content-network/chip-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
