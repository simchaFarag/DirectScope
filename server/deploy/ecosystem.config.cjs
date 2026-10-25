// PM2 process file: pm2 start deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: 'directscope-api',
      cwd: __dirname + '/..',
      script: 'dist/index.js',
      node_args: '--enable-source-maps',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
