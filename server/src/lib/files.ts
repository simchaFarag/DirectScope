import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

/**
 * Uploaded files (receipts, contracts, quotes, site photos) are served only through signed links. The API signs every
 * /uploads url it sends to a member of the project; a bare url – or one kept by someone who was removed from the
 * project – stops working when its signature expires.
 *
 * A link is valid until the end of the next UTC day, so the url stays the same all day and the browser can cache it.
 */
const DAY_S = 86_400;
const mac = (path: string, exp: number) =>
  crypto.createHmac('sha256', config.JWT_SECRET).update(`file:${path}:${exp}`).digest('base64url').slice(0, 22);

/** Stored form of a file reference: the bare /uploads/… path (absolute PUBLIC_URL links are made relative). */
export const unsigned = (url: string) => {
  const bare = url.replace(/[?#].*$/, '');
  return bare.startsWith(`${config.PUBLIC_URL}/uploads/`) ? bare.slice(config.PUBLIC_URL.length) : bare;
};

export function signFile(url: string): string;
export function signFile(url: string | null | undefined): string | undefined;
export function signFile(url: string | null | undefined) {
  if (!url) return undefined;
  const path = unsigned(url);
  if (!path.startsWith('/uploads/')) return url;
  const exp = (Math.floor(Date.now() / 1000 / DAY_S) + 2) * DAY_S;
  return `${path}?e=${exp}&s=${mac(path, exp)}`;
}

export const signAll = (urls: string[]) => urls.map((u) => signFile(u));

/** Guards express.static for /uploads: a valid, unexpired signature or 404 (no hint that the file exists). */
export function requireSignedFile(req: Request, res: Response, next: NextFunction) {
  const path = `/uploads${req.path}`;
  const e = Number(req.query.e);
  const s = typeof req.query.s === 'string' ? req.query.s : '';
  const ok =
    Number.isInteger(e) &&
    e * 1000 > Date.now() &&
    Buffer.byteLength(s) === 22 &&
    crypto.timingSafeEqual(Buffer.from(s), Buffer.from(mac(path, e)));
  if (!ok) return void res.status(404).json({ error: { code: 'not_found', message: 'הקובץ לא נמצא או שהקישור פג תוקף' } });
  next();
}
