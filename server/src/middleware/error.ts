import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';
import { logger } from '../logger.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'נתיב לא קיים' } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code ?? 'error', message: err.message } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'validation', message: 'נתונים לא תקינים', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'הקובץ גדול מדי' : 'שגיאה בהעלאת הקובץ';
    return res.status(400).json({ error: { code: err.code.toLowerCase(), message } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'not_found', message: 'לא נמצא' } });
    if (err.code === 'P2002') return res.status(409).json({ error: { code: 'conflict', message: 'הרשומה כבר קיימת' } });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { code: 'bad_json', message: 'JSON לא תקין' } });
  }

  logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { code: 'internal', message: 'שגיאת שרת' } });
}
