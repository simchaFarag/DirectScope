import type { NextFunction, Request, Response } from 'express';
import type { MemberRole, Project } from '@prisma/client';
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
  /**
   * contractors see only the contract amount (SPEC §2). False for "restricted" members: anyone the owner invited as
   * "בעל מקצוע", and anyone registered as a contractor. Restricted members also can't touch money fields or approve.
   */
  seesBudget: boolean;
  /** the role the owner gave this member when inviting them (undefined for the owner) */
  memberRole?: MemberRole;
}

/** Projects the user owns or has joined (a linked membership – a phone number alone grants nothing). */
export const visibleTo = (userId: string) => ({ OR: [{ ownerId: userId }, { members: { some: { userId } } }] });

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

  // Only a membership the invitee accepted (userId set) counts. Matching the phone alone let anyone pull a user into a
  // project without their consent.
  const member = await prisma.member.findFirst({ where: { projectId: project.id, userId: user.id } });
  if (!member) throw notFound('הפרויקט לא נמצא');

  const canEdit = member.permission === 'edit';
  // Decided by what the owner chose when inviting ("בעל מקצוע") plus the role locked at signup – never by a value the
  // member can change on their own.
  const restricted = member.role === 'professional' || user.role === 'contractor';
  req.access = {
    project,
    isOwner: false,
    canEdit,
    canApprove: canEdit && !restricted,
    seesBudget: !restricted,
    memberRole: member.role,
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
