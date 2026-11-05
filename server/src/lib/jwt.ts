import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  sub: string;
  /** User.tokenVersion when the token was issued – logout bumps it, which ends older tokens */
  ver: number;
}

export function signToken(userId: string, version = 0) {
  return jwt.sign({ sub: userId, ver: version } satisfies TokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof p !== 'object' || typeof p.sub !== 'string') return null;
    // tokens issued before versions existed count as version 0
    return { sub: p.sub, ver: typeof p.ver === 'number' ? p.ver : 0 };
  } catch {
    return null;
  }
}
