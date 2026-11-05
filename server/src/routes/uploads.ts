import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { config } from '../config.js';
import { badRequest } from '../lib/errors.js';
import { me, requireAuth } from '../middleware/auth.js';

const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

/**
 * The browser's MIME type is only a claim. Each type must also start with its real file signature, so e.g. an HTML
 * page sent as "image/png" is refused instead of stored.
 */
const startsWith = (b: Buffer, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);
const ascii = (b: Buffer, s: string, at = 0) => b.subarray(at, at + s.length).toString('latin1') === s;
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  'image/png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': (b) => ascii(b, 'RIFF') && ascii(b, 'WEBP', 8),
  'image/gif': (b) => ascii(b, 'GIF87a') || ascii(b, 'GIF89a'),
  'image/heic': (b) => ascii(b, 'ftyp', 4),
  'application/pdf': (b) => ascii(b, '%PDF-'),
  'application/msword': (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
};

function head(file: string) {
  const fd = fs.openSync(file, 'r');
  try {
    const b = Buffer.alloc(16);
    fs.readSync(fd, b, 0, 16, 0);
    return b;
  } finally {
    fs.closeSync(fd);
  }
}

/** Files are stored as uploads/YYYY-MM/<random>.<ext>; the random name is what keeps them private. */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(config.uploadDir, new Date().toISOString().slice(0, 7));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + ALLOWED[file.mimetype]),
});

export const MAX_FILES = 6;

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: MAX_FILES },
  fileFilter: (_req, file, cb) => (ALLOWED[file.mimetype] ? cb(null, true) : cb(badRequest('סוג קובץ לא נתמך (PDF, Word או תמונה)', 'bad_file_type'))),
});

/** Any logged-in user can upload, so cap it per user: 120 requests (up to 720 files) per hour. */
const perUser = rateLimit({
  windowMs: 60 * 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => me(req).id,
  message: { error: { code: 'rate_limited', message: 'הועלו יותר מדי קבצים, נסו שוב מאוחר יותר' } },
});

export const uploadsRouter = Router();

/**
 * POST /api/uploads (multipart, field "files", up to 6) →
 * [{ url, name, size, type }] – the url goes into photo / image / fileUrl fields of the other endpoints.
 * The url is relative (/uploads/…): the app and the API share one origin, so links survive a domain change.
 */
uploadsRouter.post('/', requireAuth, perUser, upload.array('files', MAX_FILES), (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw badRequest('לא נבחר קובץ');

  const bad = files.find((f) => !MAGIC[f.mimetype]?.(head(f.path)));
  if (bad) {
    for (const f of files) fs.rmSync(f.path, { force: true });
    throw badRequest('הקובץ פגום או שאינו מהסוג שנבחר (PDF, Word או תמונה)', 'bad_file_type');
  }

  res.status(201).json(
    files.map((f) => ({
      url: `/uploads/${path.relative(config.uploadDir, f.path).split(path.sep).join('/')}`,
      // multer decodes the original name as latin1; browsers send utf-8 (Hebrew file names)
      name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
      size: f.size,
      type: f.mimetype,
    })),
  );
});
