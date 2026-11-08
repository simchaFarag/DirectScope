import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { fileRef, parse, param } from '../lib/http.js';
import { normalizePhone } from '../lib/phone.js';
import { toMember } from '../lib/serialize.js';
import { me, requireAuth } from '../middleware/auth.js';
import { access, requireOwner } from '../middleware/project.js';

export const membersRouter = Router();

/** Invites go out on WhatsApp, so the number must be an Israeli mobile (the app's form already demands one). */
function mobilePhone(raw: string) {
  const phone = normalizePhone(raw);
  if (!/^\+9725\d{8}$/.test(phone)) throw badRequest('יש להזין מספר נייד – ההזמנה נשלחת בוואטסאפ', 'invalid_phone');
  return phone;
}

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
  const phone = mobilePhone(body.phone);
  if (phone === me(req).phone) throw badRequest('זה המספר שלך – אין צורך להזמין אותו', 'own_phone');
  // A second invite for the same phone used to overwrite the first one: name, role, permission and the link already sent
  // on WhatsApp. Changing an existing member goes through PATCH (the "עריכה" screen) instead.
  const exists = await prisma.member.findUnique({ where: { projectId_phone: { projectId, phone } }, select: { id: true } });
  if (exists) throw conflict('המספר הזה כבר משותף בפרויקט');
  const m = await prisma.member.create({ data: { ...body, phone, projectId, inviteToken: token ?? newToken() } });
  res.status(201).json(toMember(m));
});

membersRouter.patch('/members/:id', requireOwner, async (req, res) => {
  const projectId = access(req).project.id;
  const m = await prisma.member.findFirst({ where: { id: param(req), projectId } });
  if (!m) throw notFound('השותף לא נמצא');
  const { phone, inviteToken: token, ...rest } = parse(memberInput.partial(), req.body);
  const phoneChanged = !!phone && mobilePhone(phone) !== m.phone;
  if (phoneChanged && normalizePhone(phone) === me(req).phone) throw badRequest('זה המספר שלך – אין צורך להזמין אותו', 'own_phone');
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

/**
 * GET /api/invites/info?t=… – who invited you and to what, for the login screen the invite link opens. The token is the
 * secret from the WhatsApp message (144 random bits), which already names the project. Rate limited like login.
 */
invitesRouter.get(
  '/info',
  rateLimit({ windowMs: 15 * 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'rate_limited', message: 'יותר מדי בקשות, נסו שוב בעוד כמה דקות' } } }),
  async (req, res) => {
    const token = inviteToken.parse(req.query.t);
    const m = await prisma.member.findUnique({ where: { inviteToken: token }, include: { project: { include: { owner: true } } } });
    if (!m) throw notFound('ההזמנה לא נמצאה או שכבר נוצלה');
    res.json({ projectName: m.project.name, invitedBy: m.project.owner.firstName });
  },
);

/** GET /api/invites/pending – invitations waiting for this phone number (joined only through the link, see /accept) */
invitesRouter.get('/pending', requireAuth, async (req, res) => {
  const rows = await prisma.member.findMany({ where: { phone: me(req).phone, userId: null, inviteToken: { not: null } }, include: { project: { include: { owner: true } } } });
  res.json(rows.map((r) => ({ projectName: r.project.name, invitedBy: r.project.owner.firstName })));
});
invitesRouter.post('/accept', requireAuth, async (req, res) => {
  const { token } = parse(z.object({ token: inviteToken }), req.body);
  const user = me(req);
  const m = await prisma.member.findUnique({ where: { inviteToken: token } });
  if (!m) throw notFound('ההזמנה לא נמצאה או שכבר נוצלה');
  if (m.phone !== user.phone) throw forbidden('ההזמנה נשלחה למספר טלפון אחר');
  await prisma.member.update({ where: { id: m.id }, data: { userId: user.id, inviteToken: null } });
  res.json({ projectId: m.projectId });
});
