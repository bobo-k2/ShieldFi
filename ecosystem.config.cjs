module.exports = {
  apps: [
    {
      name: 'shieldfi',
      script: 'dist/server.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'shieldfi-tunnel',
      script: 'cloudflared',
      args: 'tunnel --no-autoupdate run --token eyJhIjoiZTNlZTI0MjAwZmI5NGExMGNlNGU1YTk0ZTdhMGNkYmQiLCJ0IjoiZDZkYmUwYTYtMTc4NC00ZDFmLWE0NDUtM2UyODEyM2UyYmEyIiwicyI6IlpEWTJOVGMzTnpZdE56UTBNUzAwTjJabExUZzFNall0WkdaaVpqSm1aRGN4T1RGaU1UZ3paVGsxWXpJdFpqQTBaUzAwWXpnekxUaGpOV1l0TldGbU5HUXhZMlptTTJJdyJ9',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: './logs/tunnel-err.log',
      out_file: './logs/tunnel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
