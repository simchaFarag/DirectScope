import { X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { Icon, type IconName } from '@/components/FigmaIcon';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, ClearField, Field, Modal, Select, TextArea, UploadSlot } from '@/components/ui';
import { usePerms, useStore } from '@/data/store';
import type { ExpenseKind, MemberRole, Permission } from '@/data/types';
import { pickImages } from '@/lib/files';
import { cn, durationLabel, fmtDate, ils, stageLabel, moneyInput, moneyText, shekels } from '@/lib/format';

const inSetup = (path: string) => path.startsWith('/setup');

/** 24 random url-safe characters for an invite link */
function newInviteToken() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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
  const { id } = useParams();
  const { s, addExtra, updateExtra } = useStore();
  // editing an existing expense (pencil on the setup card / a row in the "תוספות" tab)
  const existing = id ? s.extras.find((x) => x.id === id) : undefined;
  const [kind, setKind] = useState<ExpenseKind | undefined>(existing?.kind);
  const [other, setOther] = useState(existing?.kind === 'other' ? existing.title : '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [tasks, setTasks] = useState(existing?.tasks ? String(existing.tasks) : '');
  const [duration, setDuration] = useState(existing?.duration ?? '');
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
        <Field aria-label="סכום לתשלום" inputMode="numeric" value={amount} onChange={(e) => setAmount(moneyInput(e.target.value))} placeholder="סכום לתשלום" />
        <Field aria-label="מספר משימות לביצוע" inputMode="numeric" value={tasks} onChange={(e) => setTasks(e.target.value.replace(/\D/g, ''))} placeholder="מספר משימות לביצוע (לא חובה)" />
        <Field aria-label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="זמן עבודה (לא חובה)" />
      </div>
      <BottomActions>
        <Button
          className="mx-auto w-[314px] max-w-full"
          disabled={!title?.trim() || !(shekels(amount) > 0)}
          onClick={() => {
            const e = { kind: kind!, title: title!.trim(), amount: shekels(amount), tasks: tasks ? +tasks : undefined, duration: duration.trim() || undefined };
            if (existing) updateExtra(existing.id, e);
            else addExtra(e);
            toast(existing ? 'ההוצאה עודכנה' : 'ההוצאה נוספה לתקציב');
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
  const { seesBudget } = usePerms();
  const st = s.stages.find((x) => x.id === id);
  const [name, setName] = useState(st?.name ?? '');
  const [budget, setBudget] = useState(String(st?.budget ?? ''));
  const contract = String(st?.contractAmount ?? '');
  const [start, setStart] = useState(st?.startDate ?? '');
  const [end, setEnd] = useState(st?.endDate ?? '');
  const [duration, setDuration] = useState(st?.duration ?? '');
  const [datesOpen, setDatesOpen] = useState(false);
  if (!st) return <Navigate to={inSetup(pathname) ? "/setup/budget" : "/app/schedule"} replace />;
  const setup = inSetup(pathname);
  const contractor = !seesBudget;
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
      {/* the contractor sees the contract sum but can't change it here – a change to it is an exception request the
          client approves (the server ignores money fields from contractors); everyone else edits the stage budget */}
      {contractor ? (
        <Field label="תקציב" value={ils(+contract || 0)} readOnly aria-readonly="true" className="text-muted" />
      ) : (
        <Field label="תקציב" inputMode="numeric" value={moneyText(budget)} onChange={(e) => setBudget(moneyInput(e.target.value))} />
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
        disabled={!name.trim() || badDates}
        onClick={() => {
          // The contract sum follows the stage budget until the two were set apart (in setup there is no separate contract
          // yet), so the contractor sees the amount the client actually set – it used to keep the template's number.
          const contractAmount = setup || +contract === st.budget ? shekels(budget) : +contract || 0;
          // "זמן עבודה" follows the dates when they changed (it stayed "שבוע" for a five-week stage)
          const datesChanged = start !== st.startDate || end !== st.endDate;
          const work = datesChanged ? durationLabel(start, end) || duration : duration;
          updateStage(st.id, { name: name.trim(), budget: shekels(budget), contractAmount, startDate: start, endDate: end, duration: work });
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
          <Button
            block
            onClick={() => {
              setDatesOpen(false);
              // setup shows the "זמן עבודה" field – fill it from the new dates
              const label = durationLabel(start, end);
              if (label && (start !== st.startDate || end !== st.endDate)) setDuration(label);
            }}
          >
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
        <Field label="תקציב" inputMode="numeric" value={budget} onChange={(e) => setBudget(moneyInput(e.target.value))} placeholder="₪" />
        <Field label="זמן עבודה" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="לדוגמה: שבוע" />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!name.trim()}
          onClick={() => {
            addStage(name, shekels(budget), duration || '—');
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
  // only the project's owner manages who's in it (the server allows nobody else)
  const { isOwner } = usePerms();
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
          <span className="text-body">{s.user.gender === 'female' ? 'את' : 'אתה'}</span>
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
            {isOwner && <div className="flex flex-1 items-center justify-end gap-2 px-2">
              <button onClick={() => nav(`${base}/${m.id}`)} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label={`עריכת ${m.name}`}>
                <Icon name="sEdit" />
              </button>
              <button onClick={() => removeMember(m.id)} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label={`הסרת ${m.name}`}>
                <X size={12} strokeWidth={1.2} />
              </button>
            </div>}
          </div>
        ))}
        {isOwner && <button onClick={() => nav(`${base}/new`)} className="flex items-center gap-4 text-body font-medium leading-4 tracking-[0.042px]">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-primary-100 bg-primary-100 text-primary shadow-[0_0_5px_rgba(62,165,244,0.1)]">
            <Icon name="add" />
          </span>
          הוספת חדש
        </button>}
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
  // an Israeli mobile (WhatsApp) – the server refuses anything else, and in setup that used to stop the whole save
  const mobile = /^(0?5\d{8}|9725\d{8})$/.test(digits);
  // one entry per phone: a second one used to replace the first on the server (role, permission and the link already sent)
  const local = (p: string) => p.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '');
  const own = mobile && local(phone) === local(s.user.phone);
  const taken = mobile && s.members.some((m) => m.id !== existing?.id && !!m.phone && local(m.phone) === local(phone));
  const phoneError = own ? 'זה המספר שלך' : taken ? 'המספר הזה כבר משותף בפרויקט' : '';
  const valid = !!name.trim() && mobile && !!perm && !phoneError;
  // The link carries this member's own secret: opening it (and logging in with this phone) is what joins the project.
  // Made here, not by the server, so WhatsApp can open the moment "שמירה ושליחה" is pressed.
  const [token] = useState(() => existing?.inviteToken ?? newInviteToken());
  const inviteLink = `${location.origin}/invite?t=${token}`;

  // Contact Picker API (Android Chrome) – falls back silently elsewhere
  const pickContact = async () => {
    const nav2 = navigator as Navigator & { contacts?: { select: (p: string[], o: object) => Promise<{ name?: string[]; tel?: string[] }[]> } };
    if (!nav2.contacts) return toast('בחירה מאנשי הקשר זמינה בטלפון אנדרואיד', 'info');
    const [c] = await nav2.contacts.select(['name', 'tel'], { multiple: false });
    if (c?.name?.[0]) setName(c.name[0]);
    if (c?.tel?.[0]) setPhone(c.tel[0]);
  };

  const save = () => {
    saveMember({ id: existing?.id, name: name.trim(), phone, permission: perm!, role, avatar, inviteToken: token });
    if (!existing) {
      // Invitation is sent over WhatsApp
      const msg = encodeURIComponent(`הוזמנת לפרויקט "${s.project.name}" ב-DirectScope: ${inviteLink}`);
      window.open(`https://wa.me/972${digits.replace(/^972|^0/, '')}?text=${msg}`, '_blank', 'noopener');
      // the message is only drafted in WhatsApp – the user still has to send it there
      toast(`ההזמנה ל${name.trim()} מוכנה בוואטסאפ`);
    } else toast('השינויים נשמרו');
    nav(-1);
  };

  return (
    <SubScreen title={existing ? 'עריכה' : 'הוספה ושיתוף'} sheet>
      <Heading title={existing ? 'עריכה' : 'הוספה ושיתוף'} sub={existing ? 'שותפים קיימים, שינויים קלים' : 'שותפים שתוסיף יקבלו את פרטי ההזמנה בהודעת ווצאפ'} />
      {/* Figma "iPhone 5 / 13 / 15": contacts link + name | permission + phone (16px apart), roles, photo link – groups 24px apart */}
      <div className="space-y-6 px-6">
        <div className="space-y-4">
          {/* the Contact Picker exists only in Android Chrome – elsewhere the link only said so */}
          {!existing && 'contacts' in navigator && (
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
          {phoneError && <p className="-mt-2 px-2 text-caption text-danger">{phoneError}</p>}
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
          // the link works only for a saved member: a new one is added here too (it used to copy a link to nobody)
          disabled={!existing && !valid}
          onClick={() => {
            if (!existing) saveMember({ name: name.trim(), phone, permission: perm!, role, avatar, inviteToken: token });
            navigator.clipboard?.writeText(inviteLink).then(
              () => toast(existing ? 'הקישור הועתק' : `הקישור הועתק – ${name.trim()} נוסף/ה לשיתוף`),
              () => toast('לא ניתן להעתיק', 'info'),
            );
            if (!existing) nav(-1);
          }}
        >
          העתק קישור
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
