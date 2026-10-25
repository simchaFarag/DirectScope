import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  sub: string;
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, config.JWT_SECRET);
    return typeof p === 'object' && typeof p.sub === 'string' ? { sub: p.sub } : null;
  } catch {
    return null;
  }
}
