import type { NextFunction, Request, Response } from 'express';
import type { Project } from '@prisma/client';
import { prisma } from '../db.js';
import { forbidden, notFound } from '../lib/errors.js';
import { me } from './auth.js';

export interface Access {
  project: Project;
  /** the client who created the project */
  isOwner: boolean;
  /** may create / change content (owner, or a member invited with "עריכה") */
  canEdit: boolean;
  /** may approve / reject updates and exceptions */
  canApprove: boolean;
  /** contractors see only the contract amount (SPEC §2) */
  seesBudget: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      access?: Access;
    }
  }
}

/** Loads :projectId and works out what the current user may do in it. 404 for projects the user isn't part of. */
export async function loadProject(req: Request, _res: Response, next: NextFunction) {
  const user = me(req);
  const project = await prisma.project.findUnique({ where: { id: String(req.params.projectId) } });
  if (!project) throw notFound('הפרויקט לא נמצא');

  if (project.ownerId === user.id) {
    req.access = { project, isOwner: true, canEdit: true, canApprove: true, seesBudget: true };
    return next();
  }

  const member = await prisma.member.findFirst({ where: { projectId: project.id, OR: [{ userId: user.id }, { phone: user.phone }] } });
  if (!member) throw notFound('הפרויקט לא נמצא');

  const canEdit = member.permission === 'edit';
  const contractor = user.role === 'contractor';
  req.access = {
    project,
    isOwner: false,
    canEdit,
    canApprove: canEdit && !contractor && member.role !== 'professional',
    seesBudget: !contractor,
  };
  next();
}

export const access = (req: Request) => req.access!;

export function requireEdit(req: Request, _res: Response, next: NextFunction) {
  if (!access(req).canEdit) throw forbidden('יש לך הרשאת צפייה בלבד');
  next();
}

export function requireApprove(req: Request, _res: Response, next: NextFunction) {
  if (!access(req).canApprove) throw forbidden('רק בעל הבית יכול לאשר');
  next();
}

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (!access(req).isOwner) throw forbidden('רק יוצר הפרויקט יכול לבצע פעולה זו');
  next();
}

export function requireBudget(req: Request, _res: Response, next: NextFunction) {
  if (!access(req).seesBudget) throw forbidden('אין גישה לנתוני התקציב');
  next();
}
