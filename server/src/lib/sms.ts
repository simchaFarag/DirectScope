import { config } from '../config.js';
import { logger } from '../logger.js';

/** Sends a text message. `console` just logs it (development); `inforu` / `twilio` send a real SMS. */
export async function sendSms(to: string, body: string) {
  if (config.SMS_PROVIDER === 'console') {
    logger.info({ to, body }, 'SMS (console provider)');
    return;
  }
  if (config.SMS_PROVIDER === 'inforu') return sendInforu(to, body);

  const sid = config.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${config.TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: config.TWILIO_FROM!, Body: body }),
  });
  if (!res.ok) {
    logger.error({ status: res.status, body: await res.text() }, 'Twilio send failed');
    throw new Error('SMS send failed');
  }
}

/** InforU REST API (capi.inforu.co.il). Success is StatusId 1 – anything else is an error, even with HTTP 200. */
async function sendInforu(to: string, body: string) {
  // the env value may be pasted with quotes and with or without the "Basic " prefix
  const token = config.INFORU_TOKEN!.trim().replace(/^["'“”]+|["'“”]+$/g, '').replace(/^Basic\s+/i, '');
  // phones are stored as +972XXXXXXXXX; InforU takes the local 0XXXXXXXXX form
  const phone = to.replace(/^\+972/, '0');
  const res = await fetch(`${config.INFORU_BASE_URL.replace(/\/$/, '')}/api/v2/SMS/SendSms`, {
    method: 'POST',
    headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Data: { Message: body, Recipients: [{ Phone: phone }], Settings: { Sender: config.INFORU_SMS_SENDER } } }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { StatusId?: number; StatusDescription?: string } | null;
  if (!res.ok || json?.StatusId !== 1) {
    logger.error({ status: res.status, statusId: json?.StatusId, description: json?.StatusDescription }, 'InforU send failed');
    throw new Error('SMS send failed');
  }
}
