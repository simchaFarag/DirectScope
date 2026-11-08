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
import { signAll, signFile as f } from './files.js';

export const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : undefined);
const strings = (j: unknown) => (Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string') : []);
/** +972527683159 → 527683159 (the format the login screen uses) */
export const localPhone = (p: string) => p.replace(/^\+972/, '');

/** Titles agree with the person's gender ("בעלת הבית" – a woman was shown as "בעל הבית") */
export const roleTitle = (r: User['role'], g?: User['gender'] | null) =>
  g === 'female'
    ? { client: 'בעלת הבית', contractor: 'קבלנית ראשית', architect: 'אדריכלית', renovator: 'משפצת' }[r]
    : { client: 'בעל הבית', contractor: 'קבלן ראשי', architect: 'אדריכל', renovator: 'משפץ' }[r];

/** "שיתוף" roles – what the owner chose when inviting the member */
export const memberRoleTitle = (r: Member['role'], g?: User['gender'] | null) =>
  g === 'female' ? { professional: 'בעלת מקצוע', family: 'משפחה', renovator: 'משפצת' }[r] : { professional: 'בעל מקצוע', family: 'משפחה', renovator: 'משפץ' }[r];

/**
 * The title shown under an author's name on updates / exceptions. In someone else's project it comes from the invite,
 * not from the role the user picked at signup – a contractor who picked "משפץ" must not show up as "בעל הבית".
 */
export const authorTitle = (u: User, a: { isOwner: boolean; memberRole?: Member['role'] }) =>
  !a.isOwner && a.memberRole ? memberRoleTitle(a.memberRole, u.gender) : roleTitle(u.role, u.gender);

export const toUser = (u: User) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: localPhone(u.phone),
  gender: u.gender,
  role: u.role,
  avatar: f(u.avatar),
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

export const toTask = (t: Task) => ({ id: t.id, title: t.title, status: t.status, note: t.note ?? undefined, photo: f(t.photo) });

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
  memberAvatars: signAll(strings(s.memberAvatars)),
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
  fileUrl: f(r.fileUrl),
  preview: f(r.preview),
});

export const toShopping = (s: ShoppingItem) => ({ id: s.id, stageId: s.stageId, title: s.title, done: s.done, photo: f(s.photo), authorId: s.authorId ?? undefined });

export const toComment = (c: Comment, meId?: string) => ({
  id: c.id,
  author: c.authorName,
  text: c.text,
  createdAt: c.createdAt.toISOString(),
  mine: !!meId && c.authorId === meId,
});

export const toUpdate = (u: Update & { comments: Comment[] }, meId?: string) => {
  const photos = signAll(strings(u.photos));
  return {
    id: u.id,
    stageId: u.stageId ?? 'general',
    author: u.authorName,
    authorTitle: u.authorTitle,
    avatar: f(u.avatar),
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
  avatar: f(e.avatar),
  time: e.createdAt.toISOString(),
  createdAt: e.createdAt.toISOString(),
  title: e.title,
  description: e.description,
  amount: e.amount,
  photos: signAll(strings(e.photos)),
  status: e.status,
  rejectReason: e.rejectReason ?? undefined,
});

export const toReminder = (r: Reminder) => ({ id: r.id, stageId: r.stageId ?? 'general', text: r.text, color: r.color, authorId: r.authorId ?? undefined });

export const toDocument = (d: Document) => ({
  id: d.id,
  stageId: d.stageId ?? 'general',
  title: d.title,
  date: day(d.date)!,
  fileName: d.fileName ?? undefined,
  fileUrl: f(d.fileUrl),
  preview: f(d.preview),
  authorId: d.authorId ?? undefined,
});

export const toGallery = (g: GalleryItem) => ({ id: g.id, title: g.title, date: day(g.date)!, image: f(g.image), authorId: g.authorId ?? undefined });
export const toInspiration = (i: Inspiration) => ({ id: i.id, title: i.title, image: f(i.image), authorId: i.authorId ?? undefined });
export const toContact = (c: Contact) => ({ id: c.id, name: c.name, title: c.title, phone: c.phone, avatar: f(c.avatar), authorId: c.authorId ?? undefined });

/** Phone numbers and the invite link are for the project owner only; other members see names and roles. */
export const toMember = (m: Member, full = true) => ({
  id: m.id,
  name: m.name,
  // with the leading 0 ("0537770102"); the member screens showed "537770102"
  phone: full ? '0' + localPhone(m.phone) : '',
  role: m.role,
  permission: m.permission,
  avatar: f(m.avatar),
  joined: !!m.userId,
  inviteToken: full ? (m.inviteToken ?? undefined) : undefined,
});

export const toSubscription = (s: Subscription) => ({
  cardLast4: s.cardLast4 ?? undefined,
  monthly: s.monthly,
  nextCharge: day(s.nextCharge),
  status: s.status,
});
