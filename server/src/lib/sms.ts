import { config } from '../config.js';
import { logger } from '../logger.js';

/** Sends a text message. `console` just logs it (development); `twilio` uses the Twilio REST API. */
export async function sendSms(to: string, body: string) {
  if (config.SMS_PROVIDER === 'console') {
    logger.info({ to, body }, 'SMS (console provider)');
    return;
  }

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
