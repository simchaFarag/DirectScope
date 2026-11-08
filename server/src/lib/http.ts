import type { Request } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { badRequest } from './errors.js';
import { unsigned } from './files.js';

export const parse = <S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> => schema.parse(data);

/** "YYYY-MM-DD" in, Date (UTC midnight) out – matches MySQL DATE columns. */
export const dateIn = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך בפורמט YYYY-MM-DD')
  .transform((s) => new Date(`${s}T00:00:00Z`));

/** Shekel amounts. The DB column is a 32-bit INT; ₪1B is far above any renovation and keeps us clear of overflow (→ 500). */
export const MAX_AMOUNT = 1_000_000_000;
export const money = z.number().int().nonnegative().max(MAX_AMOUNT, 'סכום גבוה מדי');

export const today = () => new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');

/**
 * Stored file reference: a url returned from POST /api/uploads (or one of the app's own images, /img/… /avatars/…).
 * Other hosts and protocol-relative "//host" urls are refused – an editor could otherwise plant a lookalike
 * "document" that opens another site, or a tracking pixel as a photo.
 */
const ownPath = /^\/(uploads|img|avatars)\/(?!.*\.\.)[\w./%-]+$/;
export const fileRef = z
  .string()
  .max(500)
  .refine((s) => ownPath.test(s.replace(/\?.*$/, '')) || (s.startsWith(`${config.PUBLIC_URL}/uploads/`) && !s.includes('..')), 'קישור קובץ לא תקין')
  // urls come back with the signature the API added when it sent them (lib/files.ts) – stored bare
  .transform(unsigned);

/** Makes sure a stage id from the client belongs to the project in the url. */
export async function assertStage(projectId: string, stageId: string) {
  const st = await prisma.stage.findFirst({ where: { id: stageId, projectId }, select: { id: true } });
  if (!st) throw badRequest('שלב לא קיים בפרויקט', 'invalid_stage');
}

/** Route param as a string (Express 5 types allow string[] for wildcard params). */
export const param = (req: Request, name = 'id') => String(req.params[name]);

/** Stage id from the client where "general" (or nothing) means project-wide → stored as null. */
export const optionalStage = z
  .string()
  .nullish()
  .transform((s) => (s && s !== 'general' ? s : null));
