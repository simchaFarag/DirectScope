import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { forbidden } from '../lib/errors.js';
import { fileRef, parse } from '../lib/http.js';
import { toSubscription, toUser } from '../lib/serialize.js';
import { me, requireAuth } from '../middleware/auth.js';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', (req, res) => {
  res.json(toUser(me(req)));
});

/** login-3: profile (role, picture, name, gender) */
meRouter.patch('/', async (req, res) => {
  const data = parse(
    z
      .object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().max(80),
        gender: z.enum(['male', 'female']),
        role: z.enum(['client', 'contractor', 'architect', 'renovator']),
        avatar: fileRef.nullable(),
      })
      .partial(),
    req.body,
  );
  // The role is chosen once, while creating the profile. Letting it change later let a contractor switch to "client"
  // and read the budget the client keeps from them.
  const current = me(req);
  if (data.role && data.role !== current.role && current.firstName) throw forbidden('לא ניתן לשנות את התפקיד אחרי ההרשמה');
  const user = await prisma.user.update({ where: { id: current.id }, data });
  res.json(toUser(user));
});

meRouter.post('/accept-terms', async (req, res) => {
  const user = await prisma.user.update({ where: { id: me(req).id }, data: { termsAcceptedAt: new Date() } });
  res.json(toUser(user));
});

/** Payment method screen. Card details go to the clearing provider – only the last 4 digits are stored here. */
meRouter.get('/subscription', async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { userId: me(req).id } });
  res.json(sub ? toSubscription(sub) : null);
});

meRouter.put('/subscription', async (req, res) => {
  const { cardLast4 } = parse(z.object({ cardLast4: z.string().regex(/^\d{4}$/) }), req.body);
  const nextCharge = new Date();
  nextCharge.setUTCMonth(nextCharge.getUTCMonth() + 1, 1);
  nextCharge.setUTCHours(0, 0, 0, 0);
  const sub = await prisma.subscription.upsert({
    where: { userId: me(req).id },
    create: { userId: me(req).id, cardLast4, nextCharge },
    update: { cardLast4, status: 'active' },
  });
  res.json(toSubscription(sub));
});

meRouter.delete('/subscription', async (req, res) => {
  // nothing to cancel – same answer as GET for a user without a subscription
  const existing = await prisma.subscription.findUnique({ where: { userId: me(req).id } });
  if (!existing) return res.json(null);
  const sub = await prisma.subscription.update({ where: { userId: me(req).id }, data: { status: 'canceled', nextCharge: null } });
  res.json(toSubscription(sub));
});
