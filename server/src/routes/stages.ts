import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { dateIn, fileRef, money, parse, today, param } from '../lib/http.js';
import { authorTitle, toStage, toTask, toUpdate } from '../lib/serialize.js';
import { me } from '../middleware/auth.js';
import { access, requireBudget, requireEdit } from '../middleware/project.js';

export const stageInput = z.object({
  order: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(120),
  icon: z.enum(['general', 'demolition', 'plumbing', 'electric', 'ceramic', 'extras']).default('general'),
  budget: money,
  contractAmount: money.optional(),
  paid: money.optional(),
  duration: z.string().max(60).default(''),
  startDate: dateIn,
  endDate: dateIn,
  memberAvatars: z.array(fileRef).max(20).optional(),
  /** task titles */
  tasks: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
});

const taskInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(255),
  status: z.enum(['done', 'inProgress', 'todo']).default('todo'),
  note: z.string().max(2000).nullish(),
  photo: fileRef.nullish(),
});

export const stagesRouter = Router();

async function findStage(projectId: string, id: string) {
  const st = await prisma.stage.findFirst({ where: { id, projectId }, include: { tasks: true } });
  if (!st) throw notFound('השלב לא נמצא');
  return st;
}

stagesRouter.get('/stages', async (req, res) => {
  const a = access(req);
  const stages = await prisma.stage.findMany({ where: { projectId: a.project.id }, include: { tasks: true }, orderBy: { order: 'asc' } });
  res.json(stages.map((s) => toStage(s, a.seesBudget)));
});

// Adding or removing a stage changes the client's budget (and deleting one takes its receipts with it) – client side only.
stagesRouter.post('/stages', requireEdit, requireBudget, async (req, res) => {
  const a = access(req);
  const { tasks = [], ...st } = parse(stageInput, req.body);
  const count = await prisma.stage.count({ where: { projectId: a.project.id } });
  const stage = await prisma.stage.create({
    data: {
      ...st,
      projectId: a.project.id,
      order: st.order ?? count + 1,
      contractAmount: st.contractAmount ?? st.budget,
      memberAvatars: st.memberAvatars ?? [],
      tasks: { create: tasks.map((title, order) => ({ title, order })) },
    },
    include: { tasks: true },
  });
  res.status(201).json(toStage(stage, a.seesBudget));
});

// The stage's money and dates are the client's plan. A contractor (restricted member) asks for a change through an
// exception request (חריגה) or an update – editing the stage directly changed the plan without the client seeing it.
stagesRouter.patch('/stages/:id', requireEdit, async (req, res) => {
  const a = access(req);
  if (!a.seesBudget) throw forbidden('רק הלקוח יכול לערוך את השלב');
  const before = await findStage(a.project.id, param(req));
  const { tasks: _ignored, ...data } = parse(stageInput.partial(), req.body);
  // The contract sum starts equal to the budget. Until it is set apart on purpose, a budget change carries it along –
  // otherwise the contractor keeps seeing the first number for good (the app has no separate field for it).
  if (data.budget !== undefined && data.contractAmount === undefined && before.contractAmount === before.budget) data.contractAmount = data.budget;
  const stage = await prisma.stage.update({ where: { id: param(req) }, data, include: { tasks: true } });
  res.json(toStage(stage, a.seesBudget));
});

stagesRouter.delete('/stages/:id', requireEdit, requireBudget, async (req, res) => {
  await findStage(access(req).project.id, param(req));
  await prisma.stage.delete({ where: { id: param(req) } });
  res.status(204).end();
});

/** "עריכת משימות": replaces the stage's task list (order = array order). Tasks keep their id when sent back. */
stagesRouter.put('/stages/:id/tasks', requireEdit, async (req, res) => {
  const a = access(req);
  const stage = await findStage(a.project.id, param(req));
  let tasks = parse(z.array(taskInput).max(200), req.body);
  const known = new Set(stage.tasks.map((t) => t.id));
  if (!a.seesBudget) {
    // A contractor may add, rename and reorder tasks, but not remove them (dropping the open ones made a stage look
    // finished), and a task's status only changes through /complete – that is what creates the update the client approves.
    const sent = new Set(tasks.map((t) => t.id).filter(Boolean));
    if (stage.tasks.some((t) => !sent.has(t.id))) throw forbidden('רק הלקוח יכול למחוק משימות');
    const before = new Map(stage.tasks.map((t) => [t.id, t]));
    tasks = tasks.map((t) => {
      const old = t.id ? before.get(t.id) : undefined;
      return old ? { ...t, status: old.status, note: old.note, photo: old.photo } : { ...t, status: 'todo', note: null, photo: null };
    });
  }
  const keep = tasks.filter((t) => t.id && known.has(t.id)).map((t) => t.id!);

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { stageId: stage.id, id: { notIn: keep } } }),
    ...tasks.map(({ id, ...t }, order) =>
      id && known.has(id)
        ? prisma.task.update({ where: { id }, data: { ...t, order } })
        : prisma.task.create({ data: { ...t, order, stageId: stage.id } }),
    ),
  ]);
  const fresh = await prisma.task.findMany({ where: { stageId: stage.id }, orderBy: { order: 'asc' } });
  res.json(fresh.map(toTask));
});

/**
 * Marks a task done with optional documentation (note + photo).
 * A contractor's completion creates a pending update for the client; documented completions by others are auto-approved.
 */
stagesRouter.post('/stages/:id/tasks/:taskId/complete', requireEdit, async (req, res) => {
  const a = access(req);
  const u = me(req);
  const stage = await findStage(a.project.id, param(req));
  const task = stage.tasks.find((t) => t.id === param(req, 'taskId'));
  if (!task) throw notFound('המשימה לא נמצאה');
  const { note, photo } = parse(z.object({ note: z.string().max(2000).optional(), photo: fileRef.optional() }), req.body ?? {});

  // restricted = contractor / professional (see middleware/project.ts) – their completion waits for the client: the task
  // stays "בתהליך" until the client approves the update (→ done) or rejects it (→ back to todo), see updates.ts.
  const contractor = !a.seesBudget;
  const documented = contractor || !!note || !!photo;
  if (task.status === 'done') throw badRequest('המשימה כבר הושלמה');
  if (contractor && (await prisma.update.count({ where: { taskId: task.id, status: 'pending' } })))
    throw badRequest('המשימה כבר ממתינה לאישור הלקוח');

  const [updatedTask, update] = await prisma.$transaction(async (tx) => {
    const t = await tx.task.update({
      where: { id: task.id },
      data: { status: contractor ? 'inProgress' : 'done', note: note ?? null, photo: photo ?? null },
    });
    const up = documented
      ? await tx.update.create({
          data: {
            projectId: a.project.id,
            stageId: stage.id,
            taskId: task.id,
            authorId: u.id,
            authorName: `${u.firstName} ${u.lastName}`.trim(),
            authorTitle: authorTitle(u, a),
            avatar: u.avatar,
            text: `משימה הושלמה: ${task.title}${note ? ' — ' + note : ''}`,
            photos: photo ? [photo] : [],
            status: contractor ? 'pending' : 'approved',
          },
          include: { comments: true },
        })
      : null;
    // a pending update's photo reaches the gallery when the client approves it (updates.ts)
    if (photo && !contractor) await tx.galleryItem.create({ data: { projectId: a.project.id, title: task.title, date: today(), image: photo } });
    return [t, up] as const;
  });

  res.json({ task: toTask(updatedTask), update: update ? toUpdate(update, u.id) : null });
});
