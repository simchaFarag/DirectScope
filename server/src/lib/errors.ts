export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export const badRequest = (msg = 'בקשה לא תקינה', code?: string) => new HttpError(400, msg, code);
export const unauthorized = (msg = 'נדרשת התחברות') => new HttpError(401, msg, 'unauthorized');
export const forbidden = (msg = 'אין הרשאה לפעולה זו') => new HttpError(403, msg, 'forbidden');
export const notFound = (msg = 'לא נמצא') => new HttpError(404, msg, 'not_found');
export const tooMany = (msg = 'יותר מדי בקשות, נסו שוב בעוד רגע') => new HttpError(429, msg, 'rate_limited');
