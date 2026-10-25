/**
 * Client for the DirectScope API (server/). Same origin in dev (Vite proxy) and production (nginx),
 * so set VITE_API_URL only when the API lives on another domain.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TOKEN_KEY = 'directscope.token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, data?.error?.message ?? 'שגיאת תקשורת', data?.error?.code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: (path: string) => request<void>('DELETE', path),

  /** Uploads files and returns their urls (use them in photo / image / fileUrl fields). */
  upload: async (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return request<{ url: string; name: string; size: number; type: string }[]>('POST', '/uploads', form);
  },
};

/** Login flow (login-1 → login-2) */
export const auth = {
  requestCode: (phone: string) => api.post<{ ok: true; expiresIn: number }>('/auth/otp/request', { phone }),
  verify: async (phone: string, code: string) => {
    const r = await api.post<{ token: string; user: unknown; isNew: boolean }>('/auth/otp/verify', { phone, code });
    setToken(r.token);
    return r;
  },
  logout: () => setToken(null),
};

/** Converts a data URL (what pickImages() returns today) to a File for api.upload. */
export async function dataUrlToFile(dataUrl: string, name = 'image.jpg') {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type });
}
