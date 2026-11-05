import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { assertStage, fileRef, optionalStage, parse, today, param } from '../lib/http.js';
import { authorTitle, toComment, toUpdate } from '../lib/serialize.js';
import { me } from '../middleware/auth.js';
import { access, requireApprove, requireEdit } from '../middleware/project.js';

export const updatesRouter = Router();

const withComments = { comments: true } as const;

async function findUpdate(projectId: string, id: string) {
  const u = await prisma.update.findFirst({ where: { id, projectId }, include: withComments });
  if (!u) throw notFound('העדכון לא נמצא');
  return u;
}

updatesRouter.get('/updates', async (req, res) => {
  const status = z.enum(['pending', 'approved', 'rejected']).optional().parse(req.query.status);
  const rows = await prisma.update.findMany({
    where: { projectId: access(req).project.id, ...(status && { status }) },
    include: withComments,
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows.map((x) => toUpdate(x, me(req).id)));
});

/** "עדכון חדש": stage, text up to 300 chars, up to 6 photos */
updatesRouter.post('/updates', requireEdit, async (req, res) => {
  const a = access(req);
  const u = me(req);
  const body = parse(
    z.object({ stageId: optionalStage, text: z.string().trim().min(1).max(300), photos: z.array(fileRef).max(6).default([]) }),
    req.body,
  );
  if (body.stageId) await assertStage(a.project.id, body.stageId);
  const update = await prisma.update.create({
    data: {
      ...body,
      projectId: a.project.id,
      authorId: u.id,
      authorName: `${u.firstName} ${u.lastName}`.trim(),
      authorTitle: authorTitle(u, a),
      avatar: u.avatar,
      // the client's own updates don't need their own approval
      status: a.canApprove ? 'approved' : 'pending',
    },
    include: withComments,
  });
  // approved right away → its photos go to the gallery now, the same as /approve does for pending ones
  if (update.status === 'approved' && body.photos.length) {
    await prisma.galleryItem.createMany({ data: body.photos.map((image) => ({ projectId: a.project.id, title: 'עידכון יומי', date: today(), image })) });
  }
  res.status(201).json(toUpdate(update, u.id));
});

/** Approving moves the update to "תיעוד" and its photos to the gallery. */
updatesRouter.post('/updates/:id/approve', requireApprove, async (req, res) => {
  const a = access(req);
  const up = await findUpdate(a.project.id, param(req));
  if (up.status === 'approved') throw badRequest('העדכון כבר אושר');
  const photos = (Array.isArray(up.photos) ? up.photos : []) as string[];

  const [updated] = await prisma.$transaction([
    prisma.update.update({ where: { id: up.id }, data: { status: 'approved', rejectReason: null }, include: withComments }),
    prisma.galleryItem.createMany({ data: photos.map((image) => ({ projectId: a.project.id, title: 'עידכון יומי', date: today(), image })) }),
    // a contractor's "משימה הושלמה" counts only now
    ...(up.taskId ? [prisma.task.updateMany({ where: { id: up.taskId }, data: { status: 'done' } })] : []),
  ]);
  res.json(toUpdate(updated, me(req).id));
});

updatesRouter.post('/updates/:id/reject', requireApprove, async (req, res) => {
  const a = access(req);
  const up = await findUpdate(a.project.id, param(req));
  const { reason } = parse(z.object({ reason: z.string().trim().max(1000).default('') }), req.body ?? {});
  const [updated] = await prisma.$transaction([
    prisma.update.update({ where: { id: up.id }, data: { status: 'rejected', rejectReason: reason }, include: withComments }),
    // a rejected "משימה הושלמה" reopens the task (also when it had been approved and the client changed their mind)
    ...(up.taskId ? [prisma.task.updateMany({ where: { id: up.taskId }, data: { status: 'todo' } })] : []),
  ]);
  res.json(toUpdate(updated, me(req).id));
});

updatesRouter.delete('/updates/:id', requireEdit, async (req, res) => {
  const a = access(req);
  const up = await findUpdate(a.project.id, param(req));
  if (!a.isOwner && up.authorId !== me(req).id) throw forbidden('אפשר למחוק רק עדכון שכתבת');
  await prisma.$transaction([
    prisma.update.delete({ where: { id: up.id } }),
    // withdrawing a completion that is still waiting puts the task back to todo
    ...(up.taskId && up.status === 'pending' ? [prisma.task.updateMany({ where: { id: up.taskId, status: 'inProgress' }, data: { status: 'todo' } })] : []),
  ]);
  res.status(204).end();
});

/** "הוסף הערה" – comment thread on an update. Anyone with access to the project may comment, also view-only members. */
updatesRouter.post('/updates/:id/comments', async (req, res) => {
  const u = me(req);
  await findUpdate(access(req).project.id, param(req));
  const { text } = parse(z.object({ text: z.string().trim().min(1).max(2000) }), req.body);
  const c = await prisma.comment.create({ data: { updateId: param(req), authorId: u.id, authorName: u.firstName || 'משתמש', text } });
  res.status(201).json(toComment(c, u.id));
});
