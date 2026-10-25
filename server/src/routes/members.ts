import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { notFound } from '../lib/errors.js';
import { fileRef, parse, param } from '../lib/http.js';
import { normalizePhone } from '../lib/phone.js';
import { toMember } from '../lib/serialize.js';
import { access, requireOwner } from '../middleware/project.js';

export const membersRouter = Router();

const memberInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string(),
  role: z.enum(['professional', 'family', 'renovator']).default('professional'),
  permission: z.enum(['view', 'edit']).default('view'),
  avatar: fileRef.nullish(),
});

membersRouter.get('/members', async (req, res) => {
  const rows = await prisma.member.findMany({ where: { projectId: access(req).project.id }, orderBy: { createdAt: 'asc' } });
  res.json(rows.map(toMember));
});

/**
 * "הוספה ושיתוף". Links to an existing user with that phone right away; otherwise the link happens on their first login.
 * The WhatsApp invite itself is sent from the client (wa.me link) – see SPEC §6.4.
 */
membersRouter.post('/members', requireOwner, async (req, res) => {
  const projectId = access(req).project.id;
  const body = parse(memberInput, req.body);
  const phone = normalizePhone(body.phone);
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  const m = await prisma.member.upsert({
    where: { projectId_phone: { projectId, phone } },
    create: { ...body, phone, projectId, userId: user?.id },
    update: { ...body, phone },
  });
  res.status(201).json(toMember(m));
});

membersRouter.patch('/members/:id', requireOwner, async (req, res) => {
  const projectId = access(req).project.id;
  const m = await prisma.member.findFirst({ where: { id: param(req), projectId } });
  if (!m) throw notFound('השותף לא נמצא');
  const { phone, ...rest } = parse(memberInput.partial(), req.body);
  const updated = await prisma.member.update({ where: { id: m.id }, data: { ...rest, ...(phone && { phone: normalizePhone(phone) }) } });
  res.json(toMember(updated));
});

membersRouter.delete('/members/:id', requireOwner, async (req, res) => {
  const m = await prisma.member.findFirst({ where: { id: param(req), projectId: access(req).project.id } });
  if (!m) throw notFound('השותף לא נמצא');
  await prisma.member.delete({ where: { id: m.id } });
  res.status(204).end();
});
