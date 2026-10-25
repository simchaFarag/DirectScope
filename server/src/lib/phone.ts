import { badRequest } from './errors.js';

/**
 * Normalizes an Israeli phone number to E.164 (+9725XXXXXXXX).
 * Accepts "052-768-3159", "0527683159", "527683159" (as the app's login screen sends it), "+972527683159".
 */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('972')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^[2-9]\d{7,8}$/.test(d)) throw badRequest('מספר טלפון לא תקין', 'invalid_phone');
  return `+972${d}`;
}
