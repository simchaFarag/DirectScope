import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/toast';
import { api, auth, getToken } from '@/lib/api';
import * as mock from './mock';
import { clean, errorText, fromServer, serverUnavailable, type Access, type ServerState } from './remote';
import type {
  Contact,
  DocItem,
  ExceptionReq,
  ExtraExpense,
  GalleryItem,
  Inspiration,
  Member,
  Project,
  Receipt,
  Reminder,
  ShoppingItem,
  Stage,
  Task,
  Update,
  User,
} from './types';

export interface State {
  onboarded: boolean;
  user: User;
  project: Project;
  stages: Stage[];
  extras: ExtraExpense[];
  receipts: Receipt[];
  shopping: ShoppingItem[];
  updates: Update[];
  exceptions: ExceptionReq[];
  reminders: Reminder[];
  docs: DocItem[];
  gallery: GalleryItem[];
  inspiration: Inspiration[];
  contacts: Contact[];
  members: Member[];
  quotesCount: number;
  termsAccepted: boolean;
  /** payment screen – only the last 4 digits are ever kept */
  subscription: { cardLast4: string; cancelled: boolean; nextCharge?: string };
  /** set once the user is logged in and the project lives on the server; without it everything stays local (demo) */
  remote?: { projectId: string; access?: Access };
}

const initial: State = {
  onboarded: false,
  user: mock.mockUser,
  project: mock.mockProject,
  stages: mock.mockStages,
  extras: mock.mockExtras,
  receipts: mock.mockReceipts,
  shopping: mock.mockShopping,
  updates: mock.mockUpdates,
  exceptions: mock.mockExceptions,
  reminders: mock.mockReminders,
  docs: mock.mockDocs,
  gallery: mock.mockGallery,
  inspiration: mock.mockInspiration,
  contacts: mock.mockContacts,
  members: mock.mockMembers,
  quotesCount: 1,
  termsAccepted: false,
  subscription: { cardLast4: '1234', cancelled: false },
};

const DAY = 86_400_000;
const shiftDate = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

/**
 * What a new customer starts from after a real login: the demo's stage template (no progress) and nothing else of it.
 * The template's dates are moved so the project starts today – the demo's own dates started weeks ago.
 */
const blank = (): State => {
  const days = Math.round((Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${initial.project.startDate}T00:00:00Z`)) / DAY);
  return {
  ...initial,
  user: { ...initial.user, firstName: '', lastName: '', avatar: undefined },
  project: {
    ...initial.project,
    name: '',
    description: '',
    address: '',
    estimatedBudget: undefined,
    startDate: shiftDate(initial.project.startDate, days),
    endDate: shiftDate(initial.project.endDate, days),
  },
  stages: initial.stages.map((st) => ({
    ...st,
    paid: 0,
    memberAvatars: [],
    startDate: shiftDate(st.startDate, days),
    endDate: shiftDate(st.endDate, days),
    tasks: st.tasks.map((t) => ({ ...t, status: 'todo', note: undefined, photo: undefined })),
  })),
  extras: [],
  receipts: [],
  shopping: [],
  updates: [],
  exceptions: [],
  reminders: [],
  docs: [],
  gallery: [],
  inspiration: initial.inspiration.map((i) => ({ ...i, image: undefined })),
  contacts: [],
  members: [],
  quotesCount: 0,
  };
};

const KEY = 'directscope.state.v3';
/** the project this device opened last – reopened on the next login when the user is in several */
const LAST_PROJECT = 'directscope.lastProject';
/** token from an invite link (/invite?t=…), kept until the user logs in and it's accepted */
export const INVITE_KEY = 'directscope.invite';
const stored = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
};
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>;
      // a cached server project without a login token belongs to someone who logged out
      if (saved.remote && !getToken()) return initial;
      // the deployed site has no local demo – drop what an old demo session left behind
      if (import.meta.env.PROD && !getToken()) return initial;
      return { ...initial, ...saved };
    }
  } catch {
    /* storage unavailable */
  }
  return initial;
}

function useStoreValue() {
  const [s, setS] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable */
    }
  }, [s]);

  const patch = (p: Partial<State> | ((s: State) => Partial<State>)) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) }));
  const mapStage = (id: string, fn: (st: Stage) => Stage) => patch((p) => ({ stages: p.stages.map((st) => (st.id === id ? fn(st) : st)) }));

  /* ---------- server sync ----------
   * Every action updates the screen right away (as in the demo). When the project lives on the server the same change is
   * sent to the API; calls run one after another, and once the queue is empty the whole project is reloaded so ids and
   * totals come from the database. A failed call shows a toast and the reload puts the screen back in line with the server.
   */
  const toast = useToast();
  const ref = useRef(s);
  ref.current = s;
  const pid = useRef(s.remote?.projectId);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  const refresh = async () => {
    if (!pid.current) return;
    const [st, sub] = await Promise.all([
      api.get<ServerState>(`/projects/${pid.current}/state`),
      api.get<{ cardLast4?: string; status: 'active' | 'canceled'; nextCharge?: string } | null>('/me/subscription'),
    ]);
    setS((prev) => ({
      ...prev,
      ...fromServer(st),
      ...(sub && { subscription: { cardLast4: sub.cardLast4 ?? prev.subscription.cardLast4, cancelled: sub.status === 'canceled', nextCharge: sub.nextCharge } }),
    }));
  };

  const enqueue = (op: () => Promise<unknown>) => {
    pending.current++;
    queue.current = queue.current
      .then(op)
      .catch((e) => toast(errorText(e), 'info'))
      .finally(() => {
        if (--pending.current === 0) refresh().catch(() => {});
      });
  };
  /** project-scoped API call – skipped in demo mode */
  const sync = (op: (base: string) => Promise<unknown>) => {
    if (pid.current) enqueue(() => op(`/projects/${pid.current}`));
  };
  /** user-scoped API call – needs only a login */
  const syncMe = (op: () => Promise<unknown>) => {
    if (getToken()) enqueue(op);
  };

  /**
   * After OTP: takes the server user and opens a project if they have one. Returns whether a project was found.
   * With several projects: the one just joined (preferred), else the one this device opened last, else their own.
   */
  const login = async (user: Partial<User>, preferred?: string) => {
    patch((p) => ({ user: { ...p.user, ...user } }));
    const projects = await api.get<{ id: string; isOwner?: boolean }[]>('/projects');
    if (!projects.length) return false;
    const last = stored.get(LAST_PROJECT);
    const pick = projects.find((p) => p.id === preferred) ?? projects.find((p) => p.id === last) ?? projects.find((p) => p.isOwner) ?? projects[0];
    pid.current = pick.id;
    stored.set(LAST_PROJECT, pick.id);
    await refresh();
    return true;
  };

  /** Accepts the invite link this device opened (if any). Returns the project joined. */
  const acceptPendingInvite = async () => {
    const token = stored.get(INVITE_KEY);
    if (!token || !getToken()) return undefined;
    try {
      const r = await api.post<{ projectId: string }>('/invites/accept', { token });
      stored.set(INVITE_KEY, null);
      return r.projectId;
    } catch (e) {
      // offline: keep the link for the next try; anything else (used, other phone) won't get better
      if (!serverUnavailable(e)) {
        stored.set(INVITE_KEY, null);
        toast(errorText(e), 'info');
      }
      return undefined;
    }
  };

  // The browser can bring a page back from its back/forward cache with the state it had then (e.g. after saving a
  // form that was reloaded). Re-read the saved copy so a later change doesn't write the old state back.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const fresh = load();
      pid.current = fresh.remote?.projectId;
      setS(fresh);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // returning user: reload the project from the server on start
  useEffect(() => {
    if (!getToken()) return;
    api
      .get<User>('/me')
      .then(async (u) => {
        if (pid.current) await refresh();
        else await login(u);
      })
      .catch((e) => {
        // 401 = the login expired (api.ts already dropped the token); offline = keep showing the cached copy
        if (!serverUnavailable(e) && !getToken()) {
          pid.current = undefined;
          setS(initial);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Setup step 4/4 → share: creates the project with everything collected during onboarding */
  const createRemoteProject = () =>
    enqueue(async () => {
      const p = ref.current;
      const created = await api.post<{ id: string }>('/projects', {
        ...clean(p.project),
        estimatedBudget: p.project.estimatedBudget ?? null,
        onboarded: true,
        quotesCount: p.quotesCount,
        // no contract exists yet in setup: the contract sum starts as the budget the client set (the template's own
        // contract numbers used to reach the contractor for every stage that wasn't edited)
        stages: p.stages.map((st) => ({ ...clean(st), contractAmount: st.budget, paid: 0, tasks: st.tasks.map((t) => t.title) })),
      });
      // the project exists from here on: point the app at it before the rest, so one item that fails can't leave the
      // app working on a local copy while the project sits on the server without it
      pid.current = created.id;
      stored.set(LAST_PROJECT, created.id);
      const base = `/projects/${created.id}`;
      const failed: unknown[] = [];
      const each = async <T,>(items: T[], send: (x: T) => Promise<unknown>) => {
        for (const x of items) await send(x).catch((e) => failed.push(e));
      };
      await each(p.extras, (e) => api.post(`${base}/extras`, clean(e)));
      await each(p.inspiration, (i) => api.post(`${base}/inspiration`, clean(i)));
      await each(p.members, (m) => api.post(`${base}/members`, clean({ ...m, id: undefined })));
      // quotes / plans uploaded in setup step 2
      await each(p.docs, (d) => api.post(`${base}/documents`, clean({ ...d, id: undefined })));
      if (failed.length) toast(`${failed.length === 1 ? 'פריט אחד' : `${failed.length} פריטים`} לא נשמרו: ${errorText(failed[0])}`, 'info');
    });

  const actions = {
    reset: () => {
      // end the session on the server too (the request reads the token before it's cleared below)
      if (getToken()) api.post('/auth/logout').catch(() => {});
      auth.logout();
      pid.current = undefined;
      setS(initial);
    },
    login,
    acceptPendingInvite,
    /** A verified login without a project: setup starts from empty fields instead of the demo data */
    startFresh: (user: Partial<User>) => {
      pid.current = undefined;
      const b = blank();
      setS({ ...b, user: { ...b.user, ...user } });
    },
    finishOnboarding: () => {
      patch({ onboarded: true });
      if (getToken() && !pid.current) createRemoteProject();
    },
    setUser: (u: Partial<User>) => {
      patch((p) => ({ user: { ...p.user, ...u } }));
      const { firstName, lastName, gender, role, avatar } = u;
      const body = clean({ firstName, lastName, gender, role, avatar });
      if (Object.values(body).some((v) => v !== undefined)) syncMe(() => api.patch('/me', body));
    },
    /**
     * Profile screens: waits for the server and throws when it refuses, so the screen can stay and say why. Fire-and-
     * forget (setUser) moved on, and the reload after the failed save then wiped the name ("צהריים טובים ,").
     */
    saveProfile: async (u: Partial<User>) => {
      const { firstName, lastName, gender, role, avatar } = u;
      if (getToken()) await api.patch('/me', clean({ firstName, lastName, gender, role, avatar }));
      patch((p) => ({ user: { ...p.user, ...u } }));
    },
    setProject: (pr: Partial<Project>) => {
      patch((p) => ({ project: { ...p.project, ...pr } }));
      sync((b) => api.patch(b, clean(pr)));
    },
    setQuotesCount: (n: number) => patch({ quotesCount: n }),
    /** setup step 2: the uploaded quotes / plans (sent with the project when it's created; going back replaces them) */
    setSetupDocs: (docs: Omit<DocItem, 'id' | 'date'>[]) => patch({ docs: docs.map((d) => ({ ...d, id: uid(), date: today() })) }),
    acceptTerms: () => {
      patch({ termsAccepted: true });
      syncMe(() => api.post('/me/accept-terms'));
    },
    setCard: (cardLast4: string) => {
      patch((p) => ({ subscription: { ...p.subscription, cardLast4, cancelled: false } }));
      syncMe(() => api.put('/me/subscription', { cardLast4 }));
    },
    setSubscriptionCancelled: (cancelled: boolean) => {
      const { cardLast4 } = ref.current.subscription;
      patch((p) => ({ subscription: { ...p.subscription, cancelled } }));
      // renewing = saving the card again (reactivates the subscription on the server)
      syncMe(() => (cancelled ? api.del('/me/subscription') : api.put('/me/subscription', { cardLast4 })));
    },

    updateStage: (id: string, st: Partial<Stage>) => {
      mapStage(id, (x) => ({ ...x, ...st }));
      sync((b) => api.patch(`${b}/stages/${id}`, clean({ ...st, tasks: undefined })));
    },
    addStage: (name: string, budget: number, duration: string) => {
      const end = ref.current.project.endDate;
      sync((b) => api.post(`${b}/stages`, { name, budget, duration, startDate: end, endDate: end }));
      patch((p) => ({
        stages: [
          ...p.stages,
          {
            id: uid(),
            order: p.stages.length + 1,
            name,
            icon: 'general',
            budget,
            contractAmount: budget,
            paid: 0,
            duration,
            startDate: p.project.endDate,
            endDate: p.project.endDate,
            tasks: [],
            memberAvatars: [],
          },
        ],
      }));
    },
    setTasks: (stageId: string, tasks: Task[]) => {
      const named = (list: Task[]) => list.filter((t) => t.title.trim());
      const prev = named(ref.current.stages.find((x) => x.id === stageId)?.tasks ?? []);
      mapStage(stageId, (x) => ({ ...x, tasks }));
      // "הוסף משימה" adds an untitled row that is named on screen: the server only gets named tasks, and a change
      // that touches nothing but untitled rows isn't sent at all (the reload after a sync would remove the row being typed)
      if (JSON.stringify(named(tasks)) === JSON.stringify(prev)) return;
      // tasks created on this device have local ids – the server creates those and keeps the rest
      sync((b) => api.put(`${b}/stages/${stageId}/tasks`, named(tasks).map((t) => clean({ ...t, note: t.note ?? null, photo: t.photo ?? null }))));
    },

    addExtra: (e: Omit<ExtraExpense, 'id'>) => {
      patch((p) => ({ extras: [...p.extras, { ...e, id: uid() }] }));
      sync((b) => api.post(`${b}/extras`, clean(e)));
    },
    updateExtra: (id: string, e: Omit<ExtraExpense, 'id'>) => {
      patch((p) => ({ extras: p.extras.map((x) => (x.id === id ? { ...e, id } : x)) }));
      sync((b) => api.patch(`${b}/extras/${id}`, clean({ ...e, tasks: e.tasks ?? null, duration: e.duration ?? null })));
    },
    addReceipt: (r: Omit<Receipt, 'id'>) => {
      patch((p) => ({
        receipts: [{ ...r, id: uid() }, ...p.receipts],
        stages: p.stages.map((st) => (st.id === r.stageId ? { ...st, paid: st.paid + r.amount } : st)),
      }));
      sync((b) => api.post(`${b}/receipts`, clean(r)));
    },
    toggleShopping: (id: string) => {
      const done = !ref.current.shopping.find((x) => x.id === id)?.done;
      patch((p) => ({ shopping: p.shopping.map((x) => (x.id === id ? { ...x, done } : x)) }));
      sync((b) => api.patch(`${b}/shopping/${id}`, { done }));
    },
    addShopping: (stageId: string, title: string) => {
      patch((p) => ({ shopping: [...p.shopping, { id: uid(), stageId, title, done: false }] }));
      sync((b) => api.post(`${b}/shopping`, { stageId, title }));
    },
    updateShopping: (id: string, v: Partial<ShoppingItem>) => {
      patch((p) => ({ shopping: p.shopping.map((x) => (x.id === id ? { ...x, ...v } : x)) }));
      sync((b) => api.patch(`${b}/shopping/${id}`, clean({ ...v, id: undefined })));
    },
    removeShopping: (id: string) => {
      patch((p) => ({ shopping: p.shopping.filter((x) => x.id !== id) }));
      sync((b) => api.del(`${b}/shopping/${id}`));
    },

    addUpdate: (stageId: string, text: string, photos: string[] = []) => {
      sync((b) => api.post(`${b}/updates`, clean({ stageId, text, photos })));
      patch((p) => ({
        updates: [
          {
            id: uid(),
            stageId,
            author: `${p.user.firstName} ${p.user.lastName}`,
            authorTitle: roleTitle(p.user.role),
            time: 'עכשיו',
            text,
            photo: photos[0],
            photos,
            date: today(),
            // same rule as the server: an approver's own update is published right away
            status: (p.remote?.access?.canApprove ?? p.user.role === 'client') ? 'approved' : 'pending',
            comments: [],
          },
          ...p.updates,
        ],
      }));
    },
    approveUpdate: (id: string) => {
      patch((p) => {
        const u = p.updates.find((x) => x.id === id);
        return {
          updates: p.updates.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)),
          stages: u?.taskId ? setTaskStatus(p.stages, u.taskId, 'done') : p.stages,
          // approved updates with a photo move to the archive gallery
          gallery: [...(u?.photos?.length ? u.photos : u?.photo ? [u.photo] : []).map((image) => ({ id: uid(), title: 'עידכון יומי', date: today(), image })), ...p.gallery],
        };
      });
      sync((b) => api.post(`${b}/updates/${id}/approve`));
    },
    rejectUpdate: (id: string, reason: string) => {
      patch((p) => {
        const u = p.updates.find((x) => x.id === id);
        return {
          updates: p.updates.map((x) => (x.id === id ? { ...x, status: 'rejected', rejectReason: reason } : x)),
          // a rejected "משימה הושלמה" reopens the task (same as the server)
          stages: u?.taskId ? setTaskStatus(p.stages, u.taskId, 'todo') : p.stages,
        };
      });
      sync((b) => api.post(`${b}/updates/${id}/reject`, { reason }));
    },
    addComment: (updateId: string, text: string) => {
      patch((p) => ({
        updates: p.updates.map((x) =>
          x.id === updateId ? { ...x, comments: [...x.comments, { id: uid(), author: p.user.firstName, text, mine: true }] } : x,
        ),
      }));
      sync((b) => api.post(`${b}/updates/${updateId}/comments`, { text }));
    },

    addException: (e: Pick<ExceptionReq, 'stageId' | 'title' | 'description' | 'amount' | 'photos'>) => {
      sync((b) => api.post(`${b}/exceptions`, clean(e)));
      patch((p) => ({
        exceptions: [
          {
            ...e,
            id: uid(),
            author: `${p.user.firstName} ${p.user.lastName}`,
            authorTitle: roleTitle(p.user.role),
            time: 'עכשיו',
            status: 'pending',
          },
          ...p.exceptions,
        ],
      }));
    },
    setExceptionStatus: (id: string, status: ExceptionReq['status'], rejectReason?: string) => {
      patch((p) => ({ exceptions: p.exceptions.map((x) => (x.id === id ? { ...x, status, rejectReason } : x)) }));
      sync((b) => api.post(`${b}/exceptions/${id}/status`, { status, reason: rejectReason }));
    },

    addDoc: (d: Omit<DocItem, 'id' | 'date'>) => {
      patch((p) => ({ docs: [{ ...d, id: uid(), date: today() }, ...p.docs] }));
      sync((b) => api.post(`${b}/documents`, clean(d)));
    },

    /**
     * Marks a task done, optionally with documentation (designer note: "להוסיף אפשרות של תיעוד בהשלמת המשימה").
     * Contractor completion creates a pending update so the client is notified ("ברגע שהצד השני מסמן שמשימה בוצעה צריך לקפוץ").
     */
    completeTask: (stageId: string, taskId: string, note?: string, photo?: string) => {
      sync((b) => api.post(`${b}/stages/${stageId}/tasks/${taskId}/complete`, clean({ note, photo })));
      patch((p) => {
        const st = p.stages.find((x) => x.id === stageId);
        const task = st?.tasks.find((x) => x.id === taskId);
        if (!st || !task) return {};
        // contractor view (server: restricted member) → the completion waits for the client's approval
        const contractor = !(p.remote?.access?.seesBudget ?? p.user.role !== 'contractor');
        const documented = contractor || note || photo;
        return {
          // a contractor's completion counts once the client approves it – until then the task is "בתהליך"
          stages: p.stages.map((x) =>
            x.id === stageId ? { ...x, tasks: x.tasks.map((k) => (k.id === taskId ? { ...k, status: contractor ? 'inProgress' : 'done', note, photo } : k)) } : x,
          ),
          updates: documented
            ? [
                {
                  id: uid(),
                  stageId,
                  taskId,
                  author: `${p.user.firstName} ${p.user.lastName}`,
                  authorTitle: roleTitle(p.user.role),
                  time: 'עכשיו',
                  date: today(),
                  text: `משימה הושלמה: ${task.title}${note ? ' — ' + note : ''}`,
                  photo,
                  photos: photo ? [photo] : [],
                  status: contractor ? 'pending' : 'approved',
                  comments: [],
                },
                ...p.updates,
              ]
            : p.updates,
          // a pending completion's photo joins the gallery once approved
          gallery: photo && !contractor ? [{ id: uid(), title: task.title, date: today(), image: photo }, ...p.gallery] : p.gallery,
        };
      });
    },

    addReminder: (stageId: string, text: string) => {
      const color = ref.current.reminders.length % 2 ? 'yellow' : 'blue';
      patch((p) => ({ reminders: [...p.reminders, { id: uid(), stageId, text, color }] }));
      sync((b) => api.post(`${b}/reminders`, { stageId, text, color }));
    },

    addInspiration: (title: string, image?: string) => {
      patch((p) => ({ inspiration: [{ id: uid(), title, image }, ...p.inspiration] }));
      sync((b) => api.post(`${b}/inspiration`, clean({ title, image })));
    },
    addGallery: (title: string, image?: string) => {
      patch((p) => ({ gallery: [{ id: uid(), title, image, date: new Date().toISOString().slice(0, 10) }, ...p.gallery] }));
      sync((b) => api.post(`${b}/gallery`, clean({ title, image })));
    },

    saveMember: (m: Omit<Member, 'id'> & { id?: string }) => {
      patch((p) =>
        m.id
          ? { members: p.members.map((x) => (x.id === m.id ? { ...x, ...m, id: x.id } : x)) }
          : { members: [...p.members, { ...m, id: uid() }] },
      );
      const { id, ...body } = m;
      sync((b) => (id ? api.patch(`${b}/members/${id}`, clean(body)) : api.post(`${b}/members`, clean(body))));
    },
    removeMember: (id: string) => {
      patch((p) => ({ members: p.members.filter((x) => x.id !== id) }));
      sync((b) => api.del(`${b}/members/${id}`));
    },
  };

  return { s, ...actions };
}

export function roleTitle(r: User['role']) {
  return { client: 'בעל הבית', contractor: 'קבלן ראשי', architect: 'אדריכל', renovator: 'משפץ' }[r];
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}

/**
 * What the current user may do in the open project. Logged in: the server's answer (it enforces the same rules).
 * Local demo / setup before the project exists: from the role picked in the profile.
 * seesBudget=false is the contractor view: contract amounts only, no money edits, no approvals.
 */
export function usePerms(): Access {
  const { s } = useStore();
  if (s.remote?.access) return s.remote.access;
  const contractor = s.user.role === 'contractor';
  return { isOwner: !contractor, canEdit: true, canApprove: !contractor, seesBudget: !contractor };
}

/** Derived numbers used by Home / Budget / Schedule */
export function useTotals() {
  const { s } = useStore();
  return useMemo(() => {
    const approvedEx = s.exceptions.filter((e) => e.status === 'approved').reduce((a, e) => a + e.amount, 0);
    const extras = s.extras.reduce((a, e) => a + e.amount, 0);
    const base = s.stages.reduce((a, st) => a + st.budget, 0);
    const total = base + extras + approvedEx;
    const paid = s.stages.reduce((a, st) => a + st.paid, 0);
    const allTasks = s.stages.flatMap((st) => st.tasks);
    const progress = allTasks.length ? Math.round((allTasks.filter((t) => t.status === 'done').length / allTasks.length) * 100) : 0;
    // the estimated end moves out with the last stage – a stage that runs past the project's end date used to be ignored
    const endDate = s.stages.reduce((a, st) => (st.endDate > a ? st.endDate : a), s.project.endDate);
    const daysLeft = Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
    // "ימי עסקים" on the schedule dates card: Sunday–Thursday
    let workDaysLeft = 0;
    for (let i = 1; i <= daysLeft; i++) if (new Date(Date.now() + i * 86400000).getDay() < 5) workDaysLeft++;
    return { approvedEx, extras, base, total, paid, remaining: total - paid, progress, endDate, daysLeft, workDaysLeft };
  }, [s]);
}

function setTaskStatus(stages: Stage[], taskId: string, status: Task['status']): Stage[] {
  return stages.map((st) => (st.tasks.some((t) => t.id === taskId) ? { ...st, tasks: st.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) } : st));
}

export function stageProgress(st: Stage) {
  if (!st.tasks.length) return 0;
  return Math.round((st.tasks.filter((t) => t.status === 'done').length / st.tasks.length) * 100);
}

export function stageExceptions(s: State, stageId: string) {
  return s.exceptions.filter((e) => e.stageId === stageId && e.status === 'approved').reduce((a, e) => a + e.amount, 0);
}
