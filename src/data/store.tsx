import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as mock from './mock';
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
};

const KEY = 'directscope.state.v3';
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
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

  const actions = {
    reset: () => setS(initial),
    finishOnboarding: () => patch({ onboarded: true }),
    setUser: (u: Partial<User>) => patch((p) => ({ user: { ...p.user, ...u } })),
    setProject: (pr: Partial<Project>) => patch((p) => ({ project: { ...p.project, ...pr } })),
    setQuotesCount: (n: number) => patch({ quotesCount: n }),
    acceptTerms: () => patch({ termsAccepted: true }),

    updateStage: (id: string, st: Partial<Stage>) => mapStage(id, (x) => ({ ...x, ...st })),
    addStage: (name: string, budget: number, duration: string) =>
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
      })),
    setTasks: (stageId: string, tasks: Task[]) => mapStage(stageId, (x) => ({ ...x, tasks })),

    addExtra: (e: Omit<ExtraExpense, 'id'>) => patch((p) => ({ extras: [...p.extras, { ...e, id: uid() }] })),
    addReceipt: (r: Omit<Receipt, 'id'>) =>
      patch((p) => ({
        receipts: [{ ...r, id: uid() }, ...p.receipts],
        stages: p.stages.map((st) => (st.id === r.stageId ? { ...st, paid: st.paid + r.amount } : st)),
      })),
    toggleShopping: (id: string) => patch((p) => ({ shopping: p.shopping.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) })),
    addShopping: (stageId: string, title: string) => patch((p) => ({ shopping: [...p.shopping, { id: uid(), stageId, title, done: false }] })),
    updateShopping: (id: string, v: Partial<ShoppingItem>) => patch((p) => ({ shopping: p.shopping.map((x) => (x.id === id ? { ...x, ...v } : x)) })),
    removeShopping: (id: string) => patch((p) => ({ shopping: p.shopping.filter((x) => x.id !== id) })),

    addUpdate: (stageId: string, text: string, photos: string[] = []) =>
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
            status: 'pending',
            comments: [],
          },
          ...p.updates,
        ],
      })),
    approveUpdate: (id: string) =>
      patch((p) => {
        const u = p.updates.find((x) => x.id === id);
        return {
          updates: p.updates.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)),
          // approved updates with a photo move to the archive gallery
          gallery: [...(u?.photos?.length ? u.photos : u?.photo ? [u.photo] : []).map((image) => ({ id: uid(), title: 'עידכון יומי', date: today(), image })), ...p.gallery],
        };
      }),
    rejectUpdate: (id: string, reason: string) =>
      patch((p) => ({ updates: p.updates.map((x) => (x.id === id ? { ...x, status: 'rejected', rejectReason: reason } : x)) })),
    addComment: (updateId: string, text: string) =>
      patch((p) => ({
        updates: p.updates.map((x) =>
          x.id === updateId ? { ...x, comments: [...x.comments, { id: uid(), author: p.user.firstName, text, mine: true }] } : x,
        ),
      })),

    addException: (e: Pick<ExceptionReq, 'stageId' | 'title' | 'description' | 'amount' | 'photos'>) =>
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
      })),
    setExceptionStatus: (id: string, status: ExceptionReq['status'], rejectReason?: string) =>
      patch((p) => ({ exceptions: p.exceptions.map((x) => (x.id === id ? { ...x, status, rejectReason } : x)) })),

    addDoc: (d: Omit<DocItem, 'id' | 'date'>) => patch((p) => ({ docs: [{ ...d, id: uid(), date: today() }, ...p.docs] })),

    /**
     * Marks a task done, optionally with documentation (designer note: "להוסיף אפשרות של תיעוד בהשלמת המשימה").
     * Contractor completion creates a pending update so the client is notified ("ברגע שהצד השני מסמן שמשימה בוצעה צריך לקפוץ").
     */
    completeTask: (stageId: string, taskId: string, note?: string, photo?: string) =>
      patch((p) => {
        const st = p.stages.find((x) => x.id === stageId);
        const task = st?.tasks.find((x) => x.id === taskId);
        if (!st || !task) return {};
        const contractor = p.user.role === 'contractor';
        const documented = contractor || note || photo;
        return {
          stages: p.stages.map((x) => (x.id === stageId ? { ...x, tasks: x.tasks.map((k) => (k.id === taskId ? { ...k, status: 'done', note, photo } : k)) } : x)),
          updates: documented
            ? [
                {
                  id: uid(),
                  stageId,
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
          gallery: photo ? [{ id: uid(), title: task.title, date: today(), image: photo }, ...p.gallery] : p.gallery,
        };
      }),

    addReminder: (stageId: string, text: string) =>
      patch((p) => ({ reminders: [...p.reminders, { id: uid(), stageId, text, color: p.reminders.length % 2 ? 'yellow' : 'blue' }] })),

    addInspiration: (title: string, image?: string) => patch((p) => ({ inspiration: [{ id: uid(), title, image }, ...p.inspiration] })),
    addGallery: (title: string, image?: string) =>
      patch((p) => ({ gallery: [{ id: uid(), title, image, date: new Date().toISOString().slice(0, 10) }, ...p.gallery] })),

    saveMember: (m: Omit<Member, 'id'> & { id?: string }) =>
      patch((p) =>
        m.id
          ? { members: p.members.map((x) => (x.id === m.id ? { ...x, ...m, id: x.id } : x)) }
          : { members: [...p.members, { ...m, id: uid() }] },
      ),
    removeMember: (id: string) => patch((p) => ({ members: p.members.filter((x) => x.id !== id) })),
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
    const daysLeft = Math.max(0, Math.ceil((new Date(s.project.endDate).getTime() - Date.now()) / 86400000));
    return { approvedEx, extras, base, total, paid, remaining: total - paid, progress, daysLeft };
  }, [s]);
}

export function stageProgress(st: Stage) {
  if (!st.tasks.length) return 0;
  return Math.round((st.tasks.filter((t) => t.status === 'done').length / st.tasks.length) * 100);
}

export function stageExceptions(s: State, stageId: string) {
  return s.exceptions.filter((e) => e.stageId === stageId && e.status === 'approved').reduce((a, e) => a + e.amount, 0);
}
