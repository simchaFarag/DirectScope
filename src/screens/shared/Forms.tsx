import { BookUser, Copy, ImagePlus, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, Field, Pills, PhotoSourceButtons, Select, TextArea, UploadSlot } from '@/components/ui';
import { useStore } from '@/data/store';
import type { ExpenseKind, MemberRole, Permission } from '@/data/types';
import { pickImages } from '@/lib/files';
import { cn, fmtDate, stageLabel } from '@/lib/format';

const inSetup = (path: string) => path.startsWith('/setup');

/* ---------- הוספת הוצאה (הוספת שלב step 1-3) ---------- */

const kinds: { value: ExpenseKind; label: string }[] = [
  { value: 'architect', label: 'אדריכלית' },
  { value: 'designer', label: 'מעצבת פנים' },
  { value: 'surveyor', label: 'מודד' },
  { value: 'fee', label: 'אגרת בנייה' },
  { value: 'other', label: 'אחר' },
];

export function ExpenseForm() {
  const nav = useNavigate();
  const toast = useToast();
  const { addExtra } = useStore();
  const [kind, setKind] = useState<ExpenseKind>();
  const [other, setOther] = useState('');
  const [amount, setAmount] = useState('');
  const [tasks, setTasks] = useState('');
  const [duration, setDuration] = useState('');
  const title = kind === 'other' ? other : kinds.find((k) => k.value === kind)?.label;

  return (
    <SubScreen title="הוספת הוצאה" sheet>
      <Heading title="הוצאות נוספות" sub="תשלומים מחוץ לחוזה הקבלן" />
      <div className="space-y-5 px-6">
        <div>
          <p className="mb-2 text-body font-medium">מהות התשלום</p>
          <Pills options={kinds} value={kind} onChange={setKind} />
        </div>
        {kind === 'other' && <Field label="פרט את ההוצאה" value={other} onChange={(e) => setOther(e.target.value)} placeholder="לדוגמה: ביטוח, אגרה עירונית..." />}
        <Field label="סכום לתשלום" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="₪" />
        <Field label="מספר משימות לביצוע (לא חובה)" inputMode="numeric" value={tasks} onChange={(e) => setTasks(e.target.value.replace(/\D/g, ''))} />
        <Field label="זמן עבודה (לא חובה)" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="לדוגמה: שבוע" />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!title || !amount}
          onClick={() => {
            addExtra({ kind: kind!, title: title!, amount: +amount, tasks: tasks ? +tasks : undefined, duration: duration || undefined });
            toast('ההוצאה נוספה לתקציב');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/* ---------- עריכת שלב ---------- */

export function StageEdit() {
  const nav = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const { pathname } = useLocation();
  const { s, updateStage } = useStore();
  const st = s.stages.find((x) => x.id === id);
  const [name, setName] = useState(st?.name ?? '');
  const [budget, setBudget] = useState(String(st?.budget ?? ''));
  const [contract, setContract] = useState(String(st?.contractAmount ?? ''));
  const [start, setStart] = useState(st?.startDate ?? '');
  const [end, setEnd] = useState(st?.endDate ?? '');
  const [duration, setDuration] = useState(st?.duration ?? '');
  if (!st) return null;
  const badDates = !!start && !!end && end < start;

  return (
    <SubScreen title="עריכת שלב" sheet>
      <Heading title="עריכה" sub={`${stageLabel(st.order)} ${st.name}`} />
      <div className="space-y-5 px-6">
        <TextArea label="שם השלב" value={name} onChange={(e) => setName(e.target.value)} max={300} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="תקציב" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
          <Field label="סכום חוזה קבלן" inputMode="numeric" value={contract} onChange={(e) => setContract(e.target.value.replace(/\D/g, ''))} />
        </div>
        {!inSetup(pathname) && (
          <button onClick={() => nav(`/app/schedule/${st.id}/tasks`)} className="flex w-full items-center justify-between rounded-lg border border-primary-100 bg-white px-4 py-3">
            <span className="text-body">משימות</span>
            <span className="flex items-center gap-1 text-body font-semibold text-primary">
              {st.tasks.length} <Pencil size={14} />
            </span>
          </button>
        )}
        <Field label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <div>
          <p className="mb-1 text-caption text-muted">תאריכים</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} aria-label="תאריך התחלה" />
            <input type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="תאריך סיום" />
          </div>
          <p className={cn('mt-1 text-caption', badDates ? 'text-danger' : 'text-muted')} dir={badDates ? undefined : 'ltr'}>
            {badDates ? 'תאריך הסיום לפני תאריך ההתחלה' : `${start && fmtDate(start)} - ${end && fmtDate(end)}`}
          </p>
        </div>
      </div>
      <BottomActions>
        <Button
          block
          disabled={!name || badDates}
          onClick={() => {
            updateStage(st.id, { name, budget: +budget || 0, contractAmount: +contract || 0, startDate: start, endDate: end, duration });
            toast('השלב עודכן');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/* ---------- הוספת שלב (טאב זמנים) ---------- */

export function StageNew() {
  const nav = useNavigate();
  const toast = useToast();
  const { addStage } = useStore();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  return (
    <SubScreen title="הוספת שלב" sheet>
      <Heading title="הוספת שלב" sub="שלב חדש יתווסף בסוף לוח הזמנים" />
      <div className="space-y-5 px-6">
        <Field label="שם השלב" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: צבע וגמר" />
        <Field label="תקציב" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} placeholder="₪" />
        <Field label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="לדוגמה: שבוע" />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!name}
          onClick={() => {
            addStage(name, +budget || 0, duration || '—');
            toast('השלב נוסף');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/* ---------- לוח השראה (iPhone 1 / 11) ---------- */

export function InspirationBoard() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { s } = useStore();
  const setup = inSetup(pathname);
  const withImg = s.inspiration.filter((i) => i.image);
  const empty = Math.max(2, 6 - withImg.length);
  const upload = setup ? '/setup/inspiration/upload' : '/app/inspiration/upload';
  return (
    <SubScreen title="הקמת פרויקט">
      <Heading title="לוח השראה" sub="אופציונאלי - לא חובה" />
      <div className="grid grid-cols-2 gap-4 px-6">
        {withImg.map((it) => (
          <div key={it.id} className="relative">
            <UploadSlot filled={it.image} onAdd={() => {}} />
            <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 text-caption">{it.title}</span>
          </div>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <UploadSlot key={i} onAdd={() => nav(upload)} />
        ))}
      </div>
      <BottomActions>
        <Button block variant={withImg.length ? 'primary' : 'outline'} onClick={() => (setup ? nav('/setup/share') : nav(-1))}>
          {withImg.length ? 'שמירה' : 'לא כרגע'}
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

const inspoCategories = ['חדר אמבט', 'סלון', 'מטבח', 'חלונות', 'תאורה', 'ריצוף', 'צבע', 'חזית'].map((c) => ({ value: c, label: c }));

/** העלאת תמונה ללוח השראה – gallery / camera + title / category (designer note) */
export function InspirationUpload() {
  const nav = useNavigate();
  const toast = useToast();
  const { addInspiration } = useStore();
  const [q] = useSearchParams();
  const [img, setImg] = useState<string>();
  const [title, setTitle] = useState(q.get('cat') ?? '');
  return (
    <SubScreen title="העלאת תמונה" sheet>
      <Heading title="לוח השראה" sub="העלאת תמונה" />
      <div className="space-y-5 px-6">
        <UploadSlot className="aspect-[4/3]" filled={img} onAdd={() => pickImages().then(([i]) => i && setImg(i))} onRemove={() => setImg(undefined)} label="העלאת תמונה" />
        <PhotoSourceButtons onPick={([i]) => setImg(i)} />
        <div>
          <p className="mb-2 text-caption text-muted">נושא</p>
          <Pills options={inspoCategories} value={title} onChange={setTitle} />
        </div>
        <Field label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="או כתוב כותרת משלך" />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!img || !title}
          onClick={() => {
            addInspiration(title, img);
            toast('התמונה נוספה ללוח ההשראה');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/* ---------- שיתוף (iPhone 12 / 14) ---------- */

export function ShareList() {
  const nav = useNavigate();
  const toast = useToast();
  const { pathname } = useLocation();
  const { s, finishOnboarding, removeMember } = useStore();
  const setup = inSetup(pathname);
  const base = setup ? '/setup/share' : '/app/share';
  const done = () => {
    if (setup) {
      finishOnboarding();
      toast('הפרויקט הוקם בהצלחה 🎉');
      nav('/app/home', { replace: true });
    } else nav(-1);
  };
  return (
    <SubScreen title="שיתוף" sheet onBack={setup ? () => nav(-1) : undefined}>
      <Heading title="שיתוף" sub="להזמין בני זוג או אנשי מקצוע כדי שכולם יהיו מסונכרנים על התקציב, המסמכים והתקדמות השיפוץ בזמן אמת" />
      <div className="px-6">
        <div className="flex items-center gap-3 border-b border-primary-100 pb-4">
          <Avatar src={s.user.avatar ?? '/avatars/a6.png'} name={s.user.firstName} />
          <span className="text-body">אתה</span>
        </div>
        <ul className="divide-y divide-primary-50">
          {s.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-4">
              <Avatar src={m.avatar} name={m.name} />
              <div className="flex-1">
                <p className="text-body">{m.name}</p>
                <p className="text-body text-muted" dir="ltr" style={{ textAlign: 'right' }}>
                  {m.phone}
                </p>
              </div>
              <span className={cn('rounded-full px-2 text-caption', m.permission === 'edit' ? 'bg-success-soft text-success-dark' : 'bg-primary-100')}>{m.permission === 'edit' ? 'עריכה' : 'צפייה'}</span>
              <button onClick={() => nav(`${base}/${m.id}`)} className="grid h-7 w-7 place-items-center rounded-full bg-bg" aria-label="עריכה">
                <Pencil size={14} />
              </button>
              <button onClick={() => removeMember(m.id)} className="grid h-7 w-7 place-items-center rounded-full bg-bg" aria-label="הסרה">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => nav(`${base}/new`)} className="flex items-center gap-3 py-4 text-body font-medium">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-100 text-primary">
            <Plus size={20} />
          </span>
          הוספת חדש
        </button>
      </div>
      <BottomActions>
        <Button block variant={s.members.length || !setup ? 'primary' : 'outline'} onClick={done}>
          {s.members.length || !setup ? 'שמירת שינויים' : 'לא כרגע'}
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

const memberRoles: { value: MemberRole; label: string; tone: string }[] = [
  { value: 'renovator', label: 'משפץ', tone: 'text-primary' },
  { value: 'family', label: 'משפחה', tone: 'text-accent' },
  { value: 'professional', label: 'בעל מקצוע', tone: 'text-accent-dark' },
];

export function RoleChoice<T extends string>({ options, value, onChange }: { options: { value: T; label: string; tone: string }[]; value?: T; onChange: (v: T) => void }) {
  return (
    <div className="flex justify-center gap-6">
      {options.map((r) => (
        <button key={r.value} type="button" onClick={() => onChange(r.value)} className="flex flex-col items-center gap-2">
          <span className={cn('grid h-14 w-14 place-items-center rounded-full bg-white shadow-blue ring-2 transition', value === r.value ? 'ring-primary' : 'ring-transparent')}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={r.tone}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 22c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </span>
          <span className={cn('text-caption', value === r.value ? 'font-medium text-primary' : 'text-ink')}>{r.label}</span>
        </button>
      ))}
    </div>
  );
}

/** הוספה ושיתוף / עריכת שותף (iPhone 5 / 13 / 15) */
export function MemberForm() {
  const nav = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const { s, saveMember } = useStore();
  const existing = s.members.find((m) => m.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [perm, setPerm] = useState<Permission | undefined>(existing?.permission);
  const [role, setRole] = useState<MemberRole>(existing?.role ?? 'family');
  const [avatar, setAvatar] = useState(existing?.avatar);
  const digits = phone.replace(/\D/g, '');
  const valid = name && digits.length >= 9 && perm;
  const inviteLink = `${location.origin}/invite?p=${encodeURIComponent(s.project.name)}`;

  // Contact Picker API (Android Chrome) – falls back silently elsewhere
  const pickContact = async () => {
    const nav2 = navigator as Navigator & { contacts?: { select: (p: string[], o: object) => Promise<{ name?: string[]; tel?: string[] }[]> } };
    if (!nav2.contacts) return toast('בחירה מאנשי הקשר זמינה בטלפון אנדרואיד', 'info');
    const [c] = await nav2.contacts.select(['name', 'tel'], { multiple: false });
    if (c?.name?.[0]) setName(c.name[0]);
    if (c?.tel?.[0]) setPhone(c.tel[0]);
  };

  const save = () => {
    saveMember({ id: existing?.id, name, phone, permission: perm!, role, avatar });
    if (!existing) {
      // Invitation is sent over WhatsApp
      const msg = encodeURIComponent(`הוזמנת לפרויקט "${s.project.name}" ב-DirectScope: ${inviteLink}`);
      window.open(`https://wa.me/972${digits.replace(/^0|^972/, '')}?text=${msg}`, '_blank', 'noopener');
      toast(`ההזמנה נשלחה ל${name}`);
    } else toast('השינויים נשמרו');
    nav(-1);
  };

  return (
    <SubScreen title={existing ? 'עריכה' : 'הוספה ושיתוף'} sheet>
      <Heading title={existing ? 'עריכה' : 'הוספה ושיתוף'} sub={existing ? 'שותפים קיימים, שינויים קלים' : 'שותפים שתוסיף יקבלו את פרטי ההזמנה בהודעת ווצאפ'} />
      <div className="space-y-5 px-6">
        {!existing && (
          <button onClick={pickContact} className="flex items-center gap-2 text-body underline">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-50 text-primary">
              <BookUser size={16} />
            </span>
            חפש ברשימת אנשי הקשר שלך
          </button>
        )}
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" className="field" />
          <Select
            className="w-32"
            placeholder="הרשאה"
            value={perm}
            onChange={setPerm}
            options={[
              { value: 'edit', label: 'עריכה' },
              { value: 'view', label: 'צפייה' },
            ]}
          />
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="מספר טלפון נייד" className="field" />
        <div>
          <p className="mb-3 text-body">בחר את התפקיד המתאים:</p>
          <RoleChoice options={memberRoles} value={role} onChange={setRole} />
        </div>
        <button onClick={() => pickImages().then(([i]) => i && setAvatar(i))} className="flex items-center gap-2 text-body underline">
          {avatar ? <Avatar src={avatar} size={28} /> : <ImagePlus size={18} />}
          {avatar ? 'החלפת תמונה' : 'הוסף תמונת פרופיל (לא חובה)'}
        </button>
      </div>
      <BottomActions>
        <Button className="flex-[3]" disabled={!valid} onClick={save}>
          {existing ? 'שמירת שינויים' : 'שמירה ושליחה'}
        </Button>
        <Button
          variant="outline"
          className="flex-[2]"
          onClick={() => {
            navigator.clipboard?.writeText(inviteLink).then(
              () => toast('הקישור הועתק'),
              () => toast('לא ניתן להעתיק', 'info'),
            );
          }}
        >
          <Copy size={16} /> העתק קישור
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
