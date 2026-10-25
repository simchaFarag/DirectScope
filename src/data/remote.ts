/**
 * Glue between the store and the API (server/): converts the server's project state to the client `State`
 * and cleans client values before they are sent.
 */
import { ApiError } from '@/lib/api';
import type { State } from './store';

export interface Access {
  isOwner: boolean;
  canEdit: boolean;
  canApprove: boolean;
  seesBudget: boolean;
}

type Timed = { createdAt: string };
/** GET /api/projects/:id/state – same shape as State, with ISO timestamps on updates / exceptions */
export type ServerState = Omit<State, 'updates' | 'exceptions' | 'remote' | 'project'> & {
  project: State['project'] & { id: string };
  access: Access;
  updates: (State['updates'][number] & Timed)[];
  exceptions: (State['exceptions'][number] & Timed)[];
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "עכשיו" · "לפני 10 דקות" · "לפני 3 שעות" · "אתמול" · "לפני 4 ימים" · "20.01.26 · 09:15" (the formats the screens already show) */
export function relTime(iso: string) {
  const t = new Date(iso);
  const min = Math.floor((Date.now() - t.getTime()) / 60000);
  if (min < 1) return 'עכשיו';
  if (min < 60) return min === 1 ? 'לפני דקה' : `לפני ${min} דקות`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'אתמול';
  if (d === 2) return 'לפני יומיים';
  if (d < 7) return `לפני ${d} ימים`;
  return `${pad(t.getDate())}.${pad(t.getMonth() + 1)}.${String(t.getFullYear()).slice(2)} · ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

export function fromServer(st: ServerState): Partial<State> {
  return {
    onboarded: st.onboarded,
    user: st.user,
    project: st.project,
    stages: st.stages,
    extras: st.extras,
    receipts: st.receipts,
    shopping: st.shopping,
    updates: st.updates.map((u) => ({ ...u, time: relTime(u.createdAt) })),
    exceptions: st.exceptions.map((e) => ({ ...e, time: relTime(e.createdAt) })),
    reminders: st.reminders,
    docs: st.docs,
    gallery: st.gallery,
    inspiration: st.inspiration,
    contacts: st.contacts,
    members: st.members,
    quotesCount: st.quotesCount,
    termsAccepted: st.termsAccepted,
    remote: { projectId: st.project.id, access: st.access },
  };
}

const isData = (v: unknown) => typeof v === 'string' && v.startsWith('data:');

/**
 * Drops images that only exist in the browser (data: URLs – an upload that fell back offline)
 * so the server's file-url validation doesn't reject the whole request.
 */
export function clean<T extends object>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (isData(v)) continue;
    out[k] = Array.isArray(v) ? v.filter((x) => !isData(x)) : v;
  }
  return out as T;
}

/** True when there is no API behind /api (offline, dev server without backend, static hosting) – the app then keeps working as the local demo. */
export const serverUnavailable = (e: unknown) => !(e instanceof ApiError) || !e.code;

export const errorText = (e: unknown) => (serverUnavailable(e) ? 'אין חיבור לשרת, השינוי לא נשמר' : (e as ApiError).message);
