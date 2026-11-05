/**
 * Maps database rows to the shapes the React app already uses (src/data/types.ts),
 * so the client store can swap localStorage for the API without changing screens.
 */
import type {
  Comment,
  Contact,
  Document,
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
  Subscription,
  Task,
  Update,
  User,
} from '@prisma/client';

export const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : undefined);
const strings = (j: unknown) => (Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string') : []);
/** +972527683159 → 527683159 (the format the login screen uses) */
export const localPhone = (p: string) => p.replace(/^\+972/, '');

export const roleTitle = (r: User['role']) => ({ client: 'בעל הבית', contractor: 'קבלן ראשי', architect: 'אדריכל', renovator: 'משפץ' })[r];

/** "שיתוף" roles – what the owner chose when inviting the member */
export const memberRoleTitle = (r: Member['role']) => ({ professional: 'בעל מקצוע', family: 'משפחה', renovator: 'משפץ' })[r];

/**
 * The title shown under an author's name on updates / exceptions. In someone else's project it comes from the invite,
 * not from the role the user picked at signup – a contractor who picked "משפץ" must not show up as "בעל הבית".
 */
export const authorTitle = (u: User, a: { isOwner: boolean; memberRole?: Member['role'] }) =>
  !a.isOwner && a.memberRole ? memberRoleTitle(a.memberRole) : roleTitle(u.role);

export const toUser = (u: User) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: localPhone(u.phone),
  gender: u.gender,
  role: u.role,
  avatar: u.avatar ?? undefined,
  termsAccepted: !!u.termsAcceptedAt,
});

export const toProject = (p: Project, seesBudget = true) => ({
  id: p.id,
  name: p.name,
  type: p.type,
  description: p.description,
  address: p.address,
  estimatedBudget: seesBudget ? (p.estimatedBudget ?? undefined) : undefined,
  startDate: day(p.startDate)!,
  endDate: day(p.endDate)!,
  onboarded: p.onboarded,
  quotesCount: p.quotesCount,
});

export const toTask = (t: Task) => ({ id: t.id, title: t.title, status: t.status, note: t.note ?? undefined, photo: t.photo ?? undefined });

/** Contractors see only the contract amount, never the client's full budget (SPEC §2). */
export const toStage = (s: Stage & { tasks: Task[] }, seesBudget = true) => ({
  id: s.id,
  order: s.order,
  name: s.name,
  icon: s.icon,
  budget: seesBudget ? s.budget : s.contractAmount,
  contractAmount: s.contractAmount,
  paid: seesBudget ? s.paid : 0,
  duration: s.duration,
  startDate: day(s.startDate)!,
  endDate: day(s.endDate)!,
  tasks: [...s.tasks].sort((a, b) => a.order - b.order).map(toTask),
  memberAvatars: strings(s.memberAvatars),
});

export const toExtra = (e: ExtraExpense) => ({
  id: e.id,
  kind: e.kind,
  title: e.title,
  amount: e.amount,
  tasks: e.tasks ?? undefined,
  duration: e.duration ?? undefined,
});

export const toReceipt = (r: Receipt) => ({
  id: r.id,
  stageId: r.stageId,
  title: r.title,
  amount: r.amount,
  date: day(r.date)!,
  fileUrl: r.fileUrl ?? undefined,
  preview: r.preview ?? undefined,
});

export const toShopping = (s: ShoppingItem) => ({ id: s.id, stageId: s.stageId, title: s.title, done: s.done, photo: s.photo ?? undefined });

export const toComment = (c: Comment, meId?: string) => ({
  id: c.id,
  author: c.authorName,
  text: c.text,
  createdAt: c.createdAt.toISOString(),
  mine: !!meId && c.authorId === meId,
});

export const toUpdate = (u: Update & { comments: Comment[] }, meId?: string) => {
  const photos = strings(u.photos);
  return {
    id: u.id,
    stageId: u.stageId ?? 'general',
    author: u.authorName,
    authorTitle: u.authorTitle,
    avatar: u.avatar ?? undefined,
    /** ISO timestamp – the client formats it ("לפני 3 שעות") */
    time: u.createdAt.toISOString(),
    createdAt: u.createdAt.toISOString(),
    date: day(u.createdAt),
    text: u.text,
    photo: photos[0],
    photos,
    status: u.status,
    rejectReason: u.rejectReason ?? undefined,
    taskId: u.taskId ?? undefined,
    comments: [...u.comments].sort((a, b) => +a.createdAt - +b.createdAt).map((c) => toComment(c, meId)),
  };
};

export const toException = (e: ExceptionReq) => ({
  id: e.id,
  stageId: e.stageId,
  author: e.authorName,
  authorTitle: e.authorTitle,
  avatar: e.avatar ?? undefined,
  time: e.createdAt.toISOString(),
  createdAt: e.createdAt.toISOString(),
  title: e.title,
  description: e.description,
  amount: e.amount,
  photos: strings(e.photos),
  status: e.status,
  rejectReason: e.rejectReason ?? undefined,
});

export const toReminder = (r: Reminder) => ({ id: r.id, stageId: r.stageId ?? 'general', text: r.text, color: r.color });

export const toDocument = (d: Document) => ({
  id: d.id,
  stageId: d.stageId ?? 'general',
  title: d.title,
  date: day(d.date)!,
  fileName: d.fileName ?? undefined,
  fileUrl: d.fileUrl ?? undefined,
  preview: d.preview ?? undefined,
});

export const toGallery = (g: GalleryItem) => ({ id: g.id, title: g.title, date: day(g.date)!, image: g.image ?? undefined });
export const toInspiration = (i: Inspiration) => ({ id: i.id, title: i.title, image: i.image ?? undefined });
export const toContact = (c: Contact) => ({ id: c.id, name: c.name, title: c.title, phone: c.phone, avatar: c.avatar ?? undefined });

/** Phone numbers and the invite link are for the project owner only; other members see names and roles. */
export const toMember = (m: Member, full = true) => ({
  id: m.id,
  name: m.name,
  phone: full ? localPhone(m.phone) : '',
  role: m.role,
  permission: m.permission,
  avatar: m.avatar ?? undefined,
  joined: !!m.userId,
  inviteToken: full ? (m.inviteToken ?? undefined) : undefined,
});

export const toSubscription = (s: Subscription) => ({
  cardLast4: s.cardLast4 ?? undefined,
  monthly: s.monthly,
  nextCharge: day(s.nextCharge),
  status: s.status,
});
