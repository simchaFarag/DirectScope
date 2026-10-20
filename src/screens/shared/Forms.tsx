import { X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { Icon, type IconName } from '@/components/FigmaIcon';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, ClearField, Field, Modal, Select, TextArea, UploadSlot } from '@/components/ui';
import { useStore } from '@/data/store';
import type { ExpenseKind, MemberRole, Permission } from '@/data/types';
import { pickImages } from '@/lib/files';
import { cn, fmtDate, ils, stageLabel } from '@/lib/format';

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
      {/* Figma "הוספת שלב – step 1-3": dropdown + three placeholder-only fields, 24px apart */}
      <Heading title="הוספה" sub="הוצאות נוספות" />
      <div className="space-y-6 px-6">
        <Select
          placeholder="מהות התשלום"
          options={kinds}
          value={kind}
          onChange={setKind}
          detail={{
            value: 'other',
            node: (
              <label className="block">
                <span className="mb-0.5 block px-2 text-caption text-muted">פרט את ההוצאה</span>
                <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="לדוגמה: ביטוח, אגרה עירונית..." className="h-10 w-full rounded-lg border border-primary bg-white px-2 text-body placeholder:text-muted focus:outline-none" />
              </label>
            ),
          }}
        />
        <Field aria-label="סכום לתשלום" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="סכום לתשלום" />
        <Field aria-label="מספר משימות לביצוע" inputMode="numeric" value={tasks} onChange={(e) => setTasks(e.target.value.replace(/\D/g, ''))} placeholder="מספר משימות לביצוע (לא חובה)" />
        <Field aria-label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="זמן עבודה (לא חובה)" />
      </div>
      <BottomActions>
        <Button
          className="mx-auto w-[314px] max-w-full"
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
  const [datesOpen, setDatesOpen] = useState(false);
  if (!st) return null;
  const setup = inSetup(pathname);
  const contractor = s.user.role === 'contractor';
  const badDates = !!start && !!end && end < start;
  const slash = (iso: string) => (iso ? fmtDate(iso).replace(/\./g, '/') : '');

  const body = (
    /* Figma "עריכת שלב": white page, H3 heading, then name / budget / tasks / dates 24px apart and the save button */
    <div className="flex flex-col gap-6 px-6 pb-4">
      <div className="flex flex-col items-center py-4 text-center">
        <h1 className="font-display text-h3 font-bold">עריכה</h1>
        <p className="text-body">
          {stageLabel(st.order)} {st.name}
        </p>
      </div>
      <TextArea label="שם השלב" value={name} onChange={(e) => setName(e.target.value)} max={300} />
      {/* the contractor edits the contract sum, everyone else the stage budget */}
      {contractor ? (
        <Field label="תקציב" inputMode="numeric" value={contract && ils(+contract)} onChange={(e) => setContract(e.target.value.replace(/\D/g, ''))} />
      ) : (
        <Field label="תקציב" inputMode="numeric" value={budget && ils(+budget)} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
      )}
      {setup ? (
        <Field label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} />
      ) : (
        <label className="block">
          <span className="mb-0.5 block px-2 text-caption text-ink">משימות</span>
          <button onClick={() => nav(`/app/schedule/${st.id}/tasks`)} className="field text-right text-muted">
            {st.tasks.length}
          </button>
        </label>
      )}
      <div className="flex items-end gap-4">
        <button onClick={() => setDatesOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label="בחירת תאריכים">
          <Icon name="date" className="text-primary" />
        </button>
        <label className="block flex-1">
          <span className="mb-0.5 block px-2 text-caption text-ink">תאריכים</span>
          <button onClick={() => setDatesOpen(true)} className={cn('field text-right', badDates ? 'text-danger' : 'text-muted')} dir="ltr">
            {start || end ? `${slash(start)} - ${slash(end)}` : 'בחירת תאריכים'}
          </button>
        </label>
      </div>
      {badDates && <p className="-mt-4 px-2 text-caption text-danger">תאריך הסיום לפני תאריך ההתחלה</p>}
      <Button
        className="w-[314px] max-w-full self-end"
        disabled={!name || badDates}
        onClick={() => {
          updateStage(st.id, { name, budget: +budget || 0, contractAmount: +contract || 0, startDate: start, endDate: end, duration });
          toast('השלב עודכן');
          nav(-1);
        }}
      >
        שמירה
      </Button>
      <Modal open={datesOpen} onClose={() => setDatesOpen(false)} title="תאריכים">
        <div className="space-y-4">
          <Field label="תאריך התחלה" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Field label="תאריך סיום" type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          <Button block onClick={() => setDatesOpen(false)}>
            אישור
          </Button>
        </div>
      </Modal>
    </div>
  );

  // In the setup flow there is no app bar – keep the back header there
  return setup ? (
    <SubScreen title="עריכת שלב">{body}</SubScreen>
  ) : (
    <>
      <AppBar />
      <main className="animate-fade-up desk flex-1 bg-white pt-6">{body}</main>
    </>
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
      <div className="space-y-5 px-6 short:space-y-3">
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
    <SubScreen title="לוח השראה" sheet>
      <Heading title="לוח השראה" sub="אופציונאלי - לא חובה" />
      {/* Figma "iPhone 1 / 11": 162×136 squares, 8px apart, a small centred button */}
      <div className="grid grid-cols-2 gap-2 px-6">
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
        <Button className="mx-auto" variant={withImg.length ? 'primary' : 'outline'} onClick={() => (setup ? nav('/setup/share') : nav(-1))}>
          {withImg.length ? 'שמירה' : 'לא כרגע'}
        </Button>
      </BottomActions>
    </SubScreen>
  );
}


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
      {/* Figma "העלאת תמונה ללוח השראה": image, title field, small centred save. The title is the board category (prefilled from ?cat=). */}
      <div className="space-y-4 px-6">
        <UploadSlot className="aspect-[342/325]" filled={img} onAdd={() => pickImages().then(([i]) => i && setImg(i))} onRemove={() => setImg(undefined)} label="העלאת תמונה" />
        <Field aria-label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" />
      </div>
      <BottomActions inline>
        <Button
          className="mx-auto"
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
      {/* Figma "iPhone 12 / 14": you, a divider, member rows (chip + edit / remove) and "הוספת חדש", 24px apart */}
      <div className="flex flex-col gap-6 px-6">
        <div className="flex items-center gap-4">
          <Avatar src={s.user.avatar ?? '/avatars/a6.png'} name={s.user.firstName} />
          <span className="text-body">אתה</span>
        </div>
        <div className="flex h-2 items-center">
          <span className="h-[1.5px] w-full rounded-full bg-primary-100" />
        </div>
        {s.members.map((m) => (
          <div key={m.id} className="flex items-center gap-4">
            <Avatar src={m.avatar} name={m.name} />
            <div className="flex items-center gap-6">
              <div className="whitespace-nowrap text-body">
                <p>{m.name}</p>
                <p className="text-muted">{m.phone}</p>
              </div>
              <span className={cn('flex h-4 items-center rounded-lg px-2 text-caption', m.permission === 'edit' ? 'bg-success-soft text-success-dark' : 'bg-primary-100')}>{m.permission === 'edit' ? 'עריכה' : 'צפייה'}</span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 px-2">
              <button onClick={() => nav(`${base}/${m.id}`)} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label={`עריכת ${m.name}`}>
                <Icon name="sEdit" />
              </button>
              <button onClick={() => removeMember(m.id)} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label={`הסרת ${m.name}`}>
                <X size={12} strokeWidth={1.2} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => nav(`${base}/new`)} className="flex items-center gap-4 text-body font-medium leading-4 tracking-[0.042px]">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-primary-100 bg-primary-100 text-primary shadow-[0_0_5px_rgba(62,165,244,0.1)]">
            <Icon name="add" />
          </span>
          הוספת חדש
        </button>
      </div>
      <BottomActions>
        <Button className="mx-auto w-[314px] max-w-full" variant={s.members.length || !setup ? 'primary' : 'outline'} onClick={done}>
          {s.members.length || !setup ? 'שמירת שינויים' : 'לא כרגע'}
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

const memberRoles: { value: MemberRole; label: string; icon: IconName }[] = [
  { value: 'renovator', label: 'משפץ', icon: 'roleClient' },
  { value: 'family', label: 'משפחה', icon: 'roleClientF' },
  { value: 'professional', label: 'בעל מקצוע', icon: 'roleContractor' },
];

/** Figma: 56px white buttons with the 32px role icons, 12px label under each, 24px apart */
export function RoleChoice<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon: IconName }[]; value?: T; onChange: (v: T) => void }) {
  return (
    <div className="flex justify-center gap-6">
      {options.map((r) => (
        <button key={r.value} type="button" onClick={() => onChange(r.value)} className="flex flex-col items-center">
          <span className={cn('grid h-14 w-14 place-items-center rounded-full shadow-[0_0_5px_rgba(62,165,244,0.1)] transition', value === r.value ? 'bg-primary-200' : 'bg-white')}>
            <Icon name={r.icon} />
          </span>
          <span className={cn('text-caption', value === r.value ? 'font-medium text-primary' : 'text-ink')}>{r.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Figma link row: 14px underlined text next to a 24px primary-50 circle with a 16px icon */
function IconLink({ icon, children, onClick }: { icon: IconName | ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-body leading-4 tracking-[0.042px] underline">
      <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-50 text-primary">{typeof icon === 'string' ? <Icon name={icon as IconName} /> : icon}</span>
      {children}
    </button>
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
      {/* Figma "iPhone 5 / 13 / 15": contacts link + name | permission + phone (16px apart), roles, photo link – groups 24px apart */}
      <div className="space-y-6 px-6">
        <div className="space-y-4">
          {!existing && (
            <IconLink icon="contact" onClick={pickContact}>
              חפש ברשימת אנשי הקשר שלך
            </IconLink>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-8">
            <ClearField value={name} onChange={setName} placeholder="שם" />
            <Select
              className="w-[116px]"
            placeholder="הרשאה"
            value={perm}
            onChange={setPerm}
              options={[
                { value: 'edit', label: 'עריכה' },
                { value: 'view', label: 'צפייה' },
              ]}
            />
          </div>
          <ClearField value={phone} onChange={setPhone} placeholder="מספר טלפון נייד" tel />
        </div>
        <div className="space-y-2">
          <p className="text-body">בחר את התפקיד המתאים:</p>
          <RoleChoice options={memberRoles} value={role} onChange={setRole} />
        </div>
        <IconLink icon={avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : 'jpeg'} onClick={() => pickImages().then(([i]) => i && setAvatar(i))}>
          {avatar ? 'החלפת תמונה' : 'הוסף תמונת פרופיל (לא חובה)'}
        </IconLink>
      </div>
      <BottomActions>
        <Button className="flex-1" disabled={!valid} onClick={save}>
          {existing ? 'שמירת שינויים' : 'שמירה ושליחה'}
        </Button>
        <Button
          variant="outline"
          className="shrink-0 px-8"
          onClick={() => {
            navigator.clipboard?.writeText(inviteLink).then(
              () => toast('הקישור הועתק'),
              () => toast('לא ניתן להעתיק', 'info'),
            );
          }}
        >
          העתק קישור
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
