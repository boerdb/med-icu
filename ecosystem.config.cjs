/** PM2: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "med-icu",
      cwd: "/var/www/med-icu",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env_file: "/var/www/med-icu/.env.local",
      env: {
        NODE_ENV: "production",
        PORT: "3013",
      },
    },
  ],
};
