import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { badRequest } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';

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

/** Files are stored as uploads/YYYY-MM/<random>.<ext>; the random name is what keeps them private. */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(config.uploadDir, new Date().toISOString().slice(0, 7));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + ALLOWED[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 6 },
  fileFilter: (_req, file, cb) => (ALLOWED[file.mimetype] ? cb(null, true) : cb(badRequest('סוג קובץ לא נתמך (PDF, Word או תמונה)', 'bad_file_type'))),
});

export const uploadsRouter = Router();

/**
 * POST /api/uploads (multipart, field "files", up to 6) →
 * [{ url, name, size, type }] – the url goes into photo / image / fileUrl fields of the other endpoints.
 */
uploadsRouter.post('/', requireAuth, upload.array('files', 6), (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw badRequest('לא נבחר קובץ');
  res.status(201).json(
    files.map((f) => ({
      url: `${config.PUBLIC_URL}/uploads/${path.relative(config.uploadDir, f.path).split(path.sep).join('/')}`,
      // multer decodes the original name as latin1; browsers send utf-8 (Hebrew file names)
      name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
      size: f.size,
      type: f.mimetype,
    })),
  );
});
