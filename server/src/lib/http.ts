import type { Request } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { prisma } from '../db.js';
import { badRequest } from './errors.js';

export const parse = <S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> => schema.parse(data);

/** "YYYY-MM-DD" in, Date (UTC midnight) out – matches MySQL DATE columns. */
export const dateIn = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך בפורמט YYYY-MM-DD')
  .transform((s) => new Date(`${s}T00:00:00Z`));

export const today = () => new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');

/** Stored file reference: a url returned from POST /api/uploads (or a public asset path like /img/x.png). */
export const fileRef = z.string().max(500).refine((s) => s.startsWith('/') || /^https?:\/\//.test(s), 'קישור קובץ לא תקין');

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
