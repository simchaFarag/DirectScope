import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { badRequest, tooMany } from '../lib/errors.js';
import { parse } from '../lib/http.js';
import { signToken } from '../lib/jwt.js';
import { normalizePhone } from '../lib/phone.js';
import { toUser } from '../lib/serialize.js';
import { sendSms } from '../lib/sms.js';
import { me, requireAuth } from '../middleware/auth.js';

const OTP_TTL_MS = 5 * 60_000;
const RESEND_AFTER_MS = 30_000;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const hash = (phone: string, code: string) => crypto.createHmac('sha256', config.JWT_SECRET).update(`${phone}:${code}`).digest('hex');

export const authRouter = Router();

// Per-IP guard on top of the per-phone limits below, on the code routes only: logout used to share it, and a 429 there
// left the session open for 30 days. (JSON in our error shape – the default plain-text reply showed as "no connection".)
const loginLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'יותר מדי ניסיונות כניסה, נסו שוב בעוד כמה דקות' } },
});

/** login-1: send a 6-digit code to the phone */
authRouter.post('/otp/request', loginLimit, async (req, res) => {
  const { phone: raw } = parse(z.object({ phone: z.string() }), req.body);
  const phone = normalizePhone(raw);

  const recent = await prisma.otpCode.findMany({
    where: { phone, createdAt: { gt: new Date(Date.now() - 3600_000) } },
    orderBy: { createdAt: 'desc' },
  });
  if (recent[0] && Date.now() - +recent[0].createdAt < RESEND_AFTER_MS) throw tooMany('אפשר לבקש קוד חדש בעוד כמה שניות');
  if (recent.length >= MAX_PER_HOUR) throw tooMany();

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.otpCode.create({ data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  await sendSms(phone, `קוד האימות שלך ל-DirectScope: ${code}`);

  res.json({ ok: true, expiresIn: OTP_TTL_MS / 1000 });
});

/** login-2: verify the code → JWT. New phones get a user row; pending invitations for the phone are linked. */
authRouter.post('/otp/verify', loginLimit, async (req, res) => {
  const body = parse(z.object({ phone: z.string(), code: z.string().regex(/^\d{6}$/, 'קוד בן 6 ספרות') }), req.body);
  const phone = normalizePhone(body.phone);

  const devBypass = !!config.OTP_DEV_CODE && body.code === config.OTP_DEV_CODE;
  if (!devBypass) {
    const otp = await prisma.otpCode.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= MAX_ATTEMPTS) throw badRequest('הקוד פג תוקף, בקשו קוד חדש', 'otp_expired');

    const ok = crypto.timingSafeEqual(Buffer.from(otp.codeHash), Buffer.from(hash(phone, body.code)));
    if (!ok) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw badRequest('הקוד שגוי', 'otp_invalid');
    }
    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  const user = existing ?? (await prisma.user.create({ data: { phone } }));
  // Invitations sent before invite links existed have no token – those still join on login by phone.
  // Anything newer joins only through POST /api/invites/accept (the invitee opened their link).
  await prisma.member.updateMany({ where: { phone, userId: null, inviteToken: null }, data: { userId: user.id } });

  res.json({ token: signToken(user.id, user.tokenVersion), user: toUser(user), isNew: !existing || !existing.firstName });
});

/** Ends every session of this user (tokens carry tokenVersion; bumping it invalidates them). */
authRouter.post('/logout', requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: me(req).id }, data: { tokenVersion: { increment: 1 } } });
  res.status(204).end();
});
