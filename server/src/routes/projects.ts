import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { dateIn, money, parse } from '../lib/http.js';
import * as S from '../lib/serialize.js';
import { me, requireAuth } from '../middleware/auth.js';
import { access, loadProject, requireEdit, requireOwner, visibleTo } from '../middleware/project.js';
import { archiveRouter } from './archive.js';
import { budgetRouter } from './budget.js';
import { exceptionsRouter } from './exceptions.js';
import { membersRouter } from './members.js';
import { stagesRouter, stageInput } from './stages.js';
import { updatesRouter } from './updates.js';

const projectFields = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(['renovation', 'addition', 'newHome', 'other']),
  description: z.string().max(5000),
  address: z.string().max(255),
  estimatedBudget: money.nullable(),
  startDate: dateIn,
  endDate: dateIn,
  onboarded: z.boolean(),
  quotesCount: z.number().int().min(0).max(2),
});

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

/** Projects the user owns or was invited to */
projectsRouter.get('/', async (req, res) => {
  const u = me(req);
  const projects = await prisma.project.findMany({ where: visibleTo(u.id), orderBy: { createdAt: 'desc' } });
  // the full numbers come from /:id/state, which knows the member's access – the list only shows them to the owner
  res.json(projects.map((p) => ({ ...S.toProject(p, p.ownerId === u.id), isOwner: p.ownerId === u.id })));
});

/** Setup 1/4 (+ optionally the stage split from 4/4 in the same call) */
projectsRouter.post('/', async (req, res) => {
  const body = parse(
    projectFields.partial({ description: true, address: true, estimatedBudget: true, onboarded: true, quotesCount: true }).extend({
      stages: z.array(stageInput).max(50).optional(),
    }),
    req.body,
  );
  const { stages = [], ...data } = body;
  const project = await prisma.project.create({
    data: {
      ...data,
      description: data.description ?? '',
      ownerId: me(req).id,
      stages: {
        create: stages.map(({ tasks = [], ...st }, i) => ({
          ...st,
          order: st.order ?? i + 1,
          contractAmount: st.contractAmount ?? st.budget,
          memberAvatars: st.memberAvatars ?? [],
          tasks: { create: tasks.map((title, order) => ({ title, order })) },
        })),
      },
    },
  });
  res.status(201).json(S.toProject(project));
});

const project = Router({ mergeParams: true });
projectsRouter.use('/:projectId', loadProject, project);

project.get('/', (req, res) => {
  const a = access(req);
  res.json({ ...S.toProject(a.project, a.seesBudget), access: { ...a, project: undefined } });
});

/**
 * Everything the app needs in one call – same shape as the client `State` in src/data/store.tsx.
 * Budget-only data (extras, receipts) is left out for contractors.
 */
project.get('/state', async (req, res) => {
  const a = access(req);
  const u = me(req);
  const where = { projectId: a.project.id };
  const newest = { createdAt: 'desc' } as const;

  const [stages, extras, receipts, shopping, updates, exceptions, reminders, docs, gallery, inspiration, contacts, members] = await Promise.all([
    prisma.stage.findMany({ where, include: { tasks: true }, orderBy: { order: 'asc' } }),
    a.seesBudget ? prisma.extraExpense.findMany({ where, orderBy: { createdAt: 'asc' } }) : [],
    a.seesBudget ? prisma.receipt.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }) : [],
    prisma.shoppingItem.findMany({ where, orderBy: { createdAt: 'asc' } }),
    prisma.update.findMany({ where, include: { comments: true }, orderBy: newest }),
    prisma.exceptionReq.findMany({ where, orderBy: newest }),
    prisma.reminder.findMany({ where, orderBy: { createdAt: 'asc' } }),
    prisma.document.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
    prisma.galleryItem.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
    prisma.inspiration.findMany({ where, orderBy: newest }),
    prisma.contact.findMany({ where, orderBy: { createdAt: 'asc' } }),
    prisma.member.findMany({ where, orderBy: { createdAt: 'asc' } }),
  ]);

  res.json({
    onboarded: a.project.onboarded,
    user: S.toUser(u),
    project: S.toProject(a.project, a.seesBudget),
    access: { isOwner: a.isOwner, canEdit: a.canEdit, canApprove: a.canApprove, seesBudget: a.seesBudget },
    stages: stages.map((s) => S.toStage(s, a.seesBudget)),
    extras: extras.map(S.toExtra),
    receipts: receipts.map(S.toReceipt),
    shopping: shopping.map(S.toShopping),
    updates: updates.map((x) => S.toUpdate(x, u.id)),
    exceptions: exceptions.map(S.toException),
    reminders: reminders.map(S.toReminder),
    docs: docs.map(S.toDocument),
    gallery: gallery.map(S.toGallery),
    inspiration: inspiration.map(S.toInspiration),
    contacts: contacts.map(S.toContact),
    members: members.map((m) => S.toMember(m, a.isOwner)),
    quotesCount: a.project.quotesCount,
    termsAccepted: !!u.termsAcceptedAt,
  });
});

project.patch('/', requireEdit, async (req, res) => {
  const data = parse(projectFields.partial(), req.body);
  // restricted members (contractor / professional) can't see the client's budget, so they can't overwrite it either
  if (!access(req).seesBudget) delete data.estimatedBudget, delete data.onboarded, delete data.quotesCount;
  const updated = await prisma.project.update({ where: { id: access(req).project.id }, data });
  res.json(S.toProject(updated, access(req).seesBudget));
});

project.delete('/', requireOwner, async (req, res) => {
  await prisma.project.delete({ where: { id: access(req).project.id } });
  res.status(204).end();
});

project.use(stagesRouter);
project.use(budgetRouter);
project.use(updatesRouter);
project.use(exceptionsRouter);
project.use(archiveRouter);
project.use(membersRouter);
