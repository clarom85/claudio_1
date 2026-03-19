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
    }
  ]
};
