import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('30d'),

  SMS_PROVIDER: z.enum(['console', 'twilio', 'inforu']).default('console'),
  OTP_DEV_CODE: z.string().regex(/^\d{6}$/).optional().or(z.literal('').transform(() => undefined)),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  INFORU_BASE_URL: z.string().url().default('https://capi.inforu.co.il'),
  // "Basic xxx" from the InforU account (quotes and the "Basic " prefix are optional)
  INFORU_TOKEN: z.string().optional(),
  // sender name shown on the phone (up to 11 English letters/digits, approved in the InforU account)
  INFORU_SMS_SENDER: z.string().optional(),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(15),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && env.OTP_DEV_CODE) {
  console.error('OTP_DEV_CODE must be empty in production');
  process.exit(1);
}
if (env.NODE_ENV === 'production' && env.TRUST_PROXY === 0) {
  // behind nginx every request comes from 127.0.0.1, so the per-IP login limit would be shared by all users
  console.warn('WARNING: TRUST_PROXY=0 in production. Behind nginx set TRUST_PROXY=1, or all users share one login rate limit.');
}
if (env.SMS_PROVIDER === 'twilio' && !(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM)) {
  console.error('SMS_PROVIDER=twilio requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM');
  process.exit(1);
}

if (env.SMS_PROVIDER === 'inforu' && !(env.INFORU_TOKEN && env.INFORU_SMS_SENDER)) {
  console.error('SMS_PROVIDER=inforu requires INFORU_TOKEN and INFORU_SMS_SENDER');
  process.exit(1);
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  uploadDir: path.resolve(env.UPLOAD_DIR),
  maxUploadBytes: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024),
};
