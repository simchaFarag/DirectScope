import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { notFound } from '../lib/errors.js';
import { assertStage, fileRef, parse, param } from '../lib/http.js';
import { roleTitle, toException } from '../lib/serialize.js';
import { me } from '../middleware/auth.js';
import { access, requireApprove, requireEdit } from '../middleware/project.js';

export const exceptionsRouter = Router();

exceptionsRouter.get('/exceptions', async (req, res) => {
  const rows = await prisma.exceptionReq.findMany({ where: { projectId: access(req).project.id }, orderBy: { createdAt: 'desc' } });
  res.json(rows.map(toException));
});

/** Contractor: "שליחת אישור חדש" */
exceptionsRouter.post('/exceptions', requireEdit, async (req, res) => {
  const a = access(req);
  const u = me(req);
  const body = parse(
    z.object({
      stageId: z.string(),
      title: z.string().trim().min(1).max(255),
      description: z.string().max(5000).default(''),
      amount: z.number().int().nonnegative(),
      photos: z.array(fileRef).max(6).default([]),
    }),
    req.body,
  );
  await assertStage(a.project.id, body.stageId);
  const ex = await prisma.exceptionReq.create({
    data: {
      ...body,
      projectId: a.project.id,
      authorId: u.id,
      authorName: `${u.firstName} ${u.lastName}`.trim(),
      authorTitle: roleTitle(u.role),
      avatar: u.avatar,
    },
  });
  res.status(201).json(toException(ex));
});

/** Client: approve / reject. Approved amounts are added to the budget totals on the client. */
exceptionsRouter.post('/exceptions/:id/status', requireApprove, async (req, res) => {
  const { status, reason } = parse(
    z.object({ status: z.enum(['pending', 'approved', 'rejected']), reason: z.string().trim().max(1000).optional() }),
    req.body,
  );
  const ex = await prisma.exceptionReq.findFirst({ where: { id: param(req), projectId: access(req).project.id } });
  if (!ex) throw notFound('החריגה לא נמצאה');
  const updated = await prisma.exceptionReq.update({
    where: { id: ex.id },
    data: { status, rejectReason: status === 'rejected' ? (reason ?? '') : null },
  });
  res.json(toException(updated));
});
