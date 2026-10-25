import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { pingDb } from './db.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { projectsRouter } from './routes/projects.js';
import { uploadsRouter } from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.TRUST_PROXY) app.set('trust proxy', config.TRUST_PROXY);

  // uploaded images are shown by the web app on another origin
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.get('/api/health', async (_req, res) => {
    try {
      await pingDb();
      res.json({ ok: true, db: 'up', time: new Date().toISOString() });
    } catch (err) {
      logger.error({ err }, 'Health check: database down');
      res.status(503).json({ ok: false, db: 'down' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true, index: false }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
