import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { unauthorized } from '../lib/errors.js';
import { verifyToken } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const payload = token ? verifyToken(token) : null;
  if (!payload) throw unauthorized();

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized();
  req.user = user;
  next();
}

/** The authenticated user (only valid after requireAuth). */
export const me = (req: Request) => req.user!;
