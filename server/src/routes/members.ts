import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { forbidden, notFound } from '../lib/errors.js';
import { fileRef, parse, param } from '../lib/http.js';
import { normalizePhone } from '../lib/phone.js';
import { toMember } from '../lib/serialize.js';
import { me, requireAuth } from '../middleware/auth.js';
import { access, requireOwner } from '../middleware/project.js';

export const membersRouter = Router();

/** The secret in the invite link (/invite?t=…). The app makes it so the WhatsApp message can open right away. */
const inviteToken = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/);
const newToken = () => crypto.randomBytes(18).toString('base64url');

const memberInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string(),
  role: z.enum(['professional', 'family', 'renovator']).default('professional'),
  permission: z.enum(['view', 'edit']).default('view'),
  avatar: fileRef.nullish(),
  inviteToken: inviteToken.optional(),
});

membersRouter.get('/members', async (req, res) => {
  const rows = await prisma.member.findMany({ where: { projectId: access(req).project.id }, orderBy: { createdAt: 'asc' } });
  res.json(rows.map((m) => toMember(m, access(req).isOwner)));
});

/**
 * "הוספה ושיתוף". The member is NOT linked to an account here: the invitee joins by opening their invite link and
 * logging in with the invited phone (POST /api/invites/accept). The WhatsApp message is sent from the app (SPEC §6.4).
 */
membersRouter.post('/members', requireOwner, async (req, res) => {
  const projectId = access(req).project.id;
  const { inviteToken: token, ...body } = parse(memberInput, req.body);
  const phone = normalizePhone(body.phone);
  const m = await prisma.member.upsert({
    where: { projectId_phone: { projectId, phone } },
    create: { ...body, phone, projectId, inviteToken: token ?? newToken() },
    // inviting the same phone again sends a new link – it replaces the old one unless they already joined
    update: { ...body, phone, ...(token && { inviteToken: token }) },
  });
  res.status(201).json(toMember(m));
});

membersRouter.patch('/members/:id', requireOwner, async (req, res) => {
  const projectId = access(req).project.id;
  const m = await prisma.member.findFirst({ where: { id: param(req), projectId } });
  if (!m) throw notFound('השותף לא נמצא');
  const { phone, inviteToken: token, ...rest } = parse(memberInput.partial(), req.body);
  const phoneChanged = !!phone && normalizePhone(phone) !== m.phone;
  const updated = await prisma.member.update({
    where: { id: m.id },
    data: {
      ...rest,
      ...(phone && { phone: normalizePhone(phone) }),
      // a new number is a new person: drop the old link to an account and issue a fresh invite
      ...(phoneChanged && { userId: null, inviteToken: token ?? newToken() }),
      ...(!phoneChanged && token && !m.userId && { inviteToken: token }),
    },
  });
  res.json(toMember(updated));
});

membersRouter.delete('/members/:id', requireOwner, async (req, res) => {
  const m = await prisma.member.findFirst({ where: { id: param(req), projectId: access(req).project.id } });
  if (!m) throw notFound('השותף לא נמצא');
  await prisma.member.delete({ where: { id: m.id } });
  res.status(204).end();
});

/** POST /api/invites/accept { token } – the invitee joins the project. Only the invited phone number can accept. */
export const invitesRouter = Router();
invitesRouter.post('/accept', requireAuth, async (req, res) => {
  const { token } = parse(z.object({ token: inviteToken }), req.body);
  const user = me(req);
  const m = await prisma.member.findUnique({ where: { inviteToken: token } });
  if (!m) throw notFound('ההזמנה לא נמצאה או שכבר נוצלה');
  if (m.phone !== user.phone) throw forbidden('ההזמנה נשלחה למספר טלפון אחר');
  await prisma.member.update({ where: { id: m.id }, data: { userId: user.id, inviteToken: null } });
  res.json({ projectId: m.projectId });
});
