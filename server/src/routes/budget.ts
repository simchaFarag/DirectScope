import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { crud } from '../lib/crud.js';
import { notFound } from '../lib/errors.js';
import { assertStage, dateIn, fileRef, parse, today, param } from '../lib/http.js';
import { toExtra, toReceipt, toShopping } from '../lib/serialize.js';
import { access, requireBudget, requireEdit } from '../middleware/project.js';

export const budgetRouter = Router();

/** "הוצאה נוספת" – architect, designer, surveyor, fees… */
crud(budgetRouter, '/extras', {
  model: prisma.extraExpense,
  guard: [requireBudget],
  input: z.object({
    kind: z.enum(['architect', 'designer', 'surveyor', 'fee', 'other']),
    title: z.string().trim().min(1).max(120),
    amount: z.number().int().nonnegative(),
    tasks: z.number().int().nonnegative().nullish(),
    duration: z.string().max(60).nullish(),
  }),
  map: toExtra,
});

/** Shopping list per stage */
crud(budgetRouter, '/shopping', {
  model: prisma.shoppingItem,
  input: z.object({
    stageId: z.string(),
    title: z.string().trim().min(1).max(255),
    done: z.boolean().default(false),
    photo: fileRef.nullish(),
  }),
  map: toShopping,
});

// Receipts change the stage's "paid" total, so they get their own routes instead of the generic ones.
const receiptInput = z.object({
  stageId: z.string(),
  title: z.string().trim().min(1).max(255),
  amount: z.number().int().positive(),
  date: dateIn.optional(),
  fileUrl: fileRef.nullish(),
  preview: fileRef.nullish(),
});

budgetRouter.get('/receipts', requireBudget, async (req, res) => {
  const rows = await prisma.receipt.findMany({ where: { projectId: access(req).project.id }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] });
  res.json(rows.map(toReceipt));
});

budgetRouter.post('/receipts', requireBudget, requireEdit, async (req, res) => {
  const projectId = access(req).project.id;
  const data = parse(receiptInput, req.body);
  await assertStage(projectId, data.stageId);
  const [receipt] = await prisma.$transaction([
    prisma.receipt.create({ data: { ...data, date: data.date ?? today(), projectId } }),
    prisma.stage.update({ where: { id: data.stageId }, data: { paid: { increment: data.amount } } }),
  ]);
  res.status(201).json(toReceipt(receipt));
});

budgetRouter.delete('/receipts/:id', requireBudget, requireEdit, async (req, res) => {
  const r = await prisma.receipt.findFirst({ where: { id: param(req), projectId: access(req).project.id } });
  if (!r) throw notFound();
  await prisma.$transaction([
    prisma.receipt.delete({ where: { id: r.id } }),
    prisma.stage.update({ where: { id: r.stageId }, data: { paid: { decrement: r.amount } } }),
  ]);
  res.status(204).end();
});
