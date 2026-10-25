import { createApp } from './app.js';
import { config } from './config.js';
import { pingDb, prisma } from './db.js';
import { logger } from './logger.js';

async function main() {
  try {
    await pingDb();
    logger.info('Database connected');
  } catch (err) {
    // keep running so /api/health reports the problem; Prisma reconnects on the next query
    logger.error({ err }, 'Database not reachable at startup – check DATABASE_URL');
  }

  const server = createApp().listen(config.PORT, () => logger.info(`DirectScope API listening on :${config.PORT} (${config.NODE_ENV})`));

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
