module.exports = {
  apps: [
    {
      name: "dikidi-web",
      script: "node_modules/next/dist/bin/next",
      args: "start apps/web -p 3000",
      cwd: "/home/ubuntu/dikidi",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_file: "/home/ubuntu/dikidi/logs/app.log",
      time: true,
    },
    {
      name: "dikidi-bot",
      script: "scripts/bot-daemon.cjs",
      cwd: "/home/ubuntu/dikidi",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/home/ubuntu/dikidi/logs/bot.log",
      time: true,
    },
  ],
};
