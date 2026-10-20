import { Icon } from '@/components/FigmaIcon';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, SubScreen } from '@/components/layout';
import { General, StageGlyph } from '@/components/icons';
import { BottomActions, Button, ClearField, Field, Select, UploadSlot } from '@/components/ui';
import { useStore } from '@/data/store';
import type { ProjectType } from '@/data/types';
import { pickDocument } from '@/lib/files';
import { cn, ils, stageLabel } from '@/lib/format';

const types: { value: ProjectType; label: string }[] = [
  { value: 'renovation', label: 'שיפוץ דירה' },
  { value: 'addition', label: 'תוספת לדירה' },
  { value: 'newHome', label: 'בית חדש' },
  { value: 'other', label: 'אופציה' },
];

/** הקמת פרויקט 1/4 (login-step 13) */
export function ProjectDetails() {
  const nav = useNavigate();
  const { s, setProject } = useStore();
  const [name, setName] = useState(s.project.name);
  const [type, setType] = useState<ProjectType>(s.project.type);
  const [desc, setDesc] = useState(s.project.description);
  const [address, setAddress] = useState(s.project.address);
  const [budget, setBudget] = useState(s.project.estimatedBudget ? String(s.project.estimatedBudget) : '');

  return (
    <SubScreen title="הקמת פרויקט" step={{ n: 1, of: 4 }}>
      <Heading title="פרטי הפרויקט" sub="מי ? מה ? ואיפה .." />
      {/* Figma "login-step 4 / 13": placeholder-only fields 24px apart; the type dropdown with the extra description 8px under it */}
      <div className="flex flex-col gap-6 px-6 short:gap-4">
        <Field aria-label="שם הפרויקט" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הפרויקט" />
        <div className="flex flex-col gap-2">
          <Select placeholder="פירוט על הפרויקט, מה בונים?" options={types} value={type} onChange={setType} />
          <Field aria-label="תיאור נוסף" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="תיאור נוסף (לא חובה)" />
        </div>
        <Field aria-label="כתובת הנכס" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="כתובת הנכס" />
        <ClearField value={budget && ils(+budget)} onChange={(v) => setBudget(v.replace(/\D/g, ''))} placeholder="תקציב משוער (לא חובה)" />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!name || !address}
          onClick={() => {
            setProject({ name, type, description: desc, address, estimatedBudget: budget ? +budget : undefined });
            nav('/setup/docs');
          }}
        >
          המשך
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** הקמת פרויקט 2/4 (login-step 5) */
export function UploadDocs() {
  const nav = useNavigate();
  const { setQuotesCount } = useStore();
  type Slot = { name: string; preview?: string } | undefined;
  const [quotes, setQuotes] = useState<Slot[]>([undefined, undefined]);
  const [plans, setPlans] = useState<Slot[]>([undefined, undefined]);
  const put = (arr: Slot[], set: (a: Slot[]) => void, i: number, v: Slot) => set(arr.map((x, j) => (j === i ? v : x)));
  const slot = (arr: Slot[], set: (a: Slot[]) => void, i: number) => (
    <UploadSlot
      key={i}
      filled={arr[i] ? (arr[i]!.preview ?? true) : undefined}
      label={arr[i]?.name ?? 'העלאת קובץ'}
      onAdd={() => pickDocument().then((f) => f && put(arr, set, i, f))}
      onRemove={() => put(arr, set, i, undefined)}
    />
  );

  return (
    <SubScreen title="הקמת פרויקט" step={{ n: 2, of: 4 }}>
      <Heading title="העלאת מסמכים" sub="השוואת נתונים ובדיקה" />
      {/* Figma "login-step 5": two groups of 162×136 tiles (16px apart), 24px between groups, the note 40px below */}
      <div className="flex flex-col gap-10 px-6 short:gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1 whitespace-nowrap text-lg leading-6">
              הצעת מחיר קבלן <span className="text-body text-muted">(ניתן להוסיף עד 2 לבדיקה)</span>
            </p>
            <div className="grid grid-cols-2 gap-4">{quotes.map((_, i) => slot(quotes, setQuotes, i))}</div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-lg leading-6">תוכניות אדריכליות</p>
            <div className="grid grid-cols-2 gap-4">{plans.map((_, i) => slot(plans, setPlans, i))}</div>
          </div>
        </div>
        <p className="text-center text-body text-muted">
          לאחר העלאת המסמכים, נשווה בין דרישות האדריכל לבין הצעות המחיר של הקבלנים. נבדוק עבורך שכל הסעיפים קיימים, נזהה הבדלי ניסוח וכמובן נבדוק מחירים
        </p>
      </div>
      <BottomActions>
        <Button
          className="mx-auto w-[314px] max-w-full"
          disabled={!quotes.some(Boolean)}
          onClick={() => {
            setQuotesCount(quotes.filter(Boolean).length);
            nav('/setup/checking');
          }}
        >
          המשך לבדיקה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** Figma "level card": 24px icon beside a 16px semibold title and body sub, the content 16px below */
function InfoCard({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-primary-100 p-4">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-primary">{icon}</span>
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-lg font-semibold leading-5">{title}</h3>
          <p className="text-body">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 pr-6">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2 text-body">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" /> {t}
        </li>
      ))}
    </ul>
  );
}

/** Match ring (login-step 14: 96px, login-step 15: 76px), light track, blue arc */
function MatchRing({ value, size = 96 }: { value: number; size?: number }) {
  const sw = size > 80 ? 8 : 5;
  const r = size / 2 - sw / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F2F7FE" strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#3DA5F4" strokeWidth={sw} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-semibold leading-5">{value}%</div>
        <div className="text-caption text-muted">התאמה</div>
      </div>
    </div>
  );
}

/** הקמת פרויקט 3/4 (login-step 14 / 15) */
export function CheckResults() {
  const nav = useNavigate();
  const { s } = useStore();
  const two = s.quotesCount > 1;
  return (
    <SubScreen title="הקמת פרויקט" step={{ n: 3, of: 4 }}>
      <Heading title="נתוני הבדיקה" sub="סיכום ממצאי בדיקת המערכת" />
      <div className="flex flex-col gap-6 px-6 short:gap-4">
        {two ? (
          <>
            <div className="flex justify-center gap-8">
              {[
                { l: 'קבלן א’', n: 'דן שם טוב', v: 82, best: true },
                { l: 'קבלן ב’', n: 'האחים חסיד', v: 67 },
              ].map((q) => (
                /* name and company above the ring; the recommended one has a blue outline */
                <div key={q.l} className={cn('flex w-[110px] flex-col items-center gap-3 rounded-lg px-3 pb-4 pt-3', q.best ? 'border border-primary-300 bg-primary-50' : 'border border-transparent bg-bg')}>
                  <div className="text-center">
                    <p className="text-body font-medium">{q.l}</p>
                    <p className="text-caption text-muted">{q.n}</p>
                  </div>
                  <MatchRing value={q.v} size={76} />
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-primary-200 bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-body font-semibold">
                <Icon name="bulb" className="text-accent" /> המלצת המערכת: קבלן א’
              </p>
              <p className="text-caption leading-6">למרות שמחירו גבוה יותר ב-₪35,000 — הצעתו מכסה את התכנית האדריכלית בצורה מלאה יותר ואין בה סעיפים פתוחים.</p>
            </div>
          </>
        ) : (
          /* Figma "login-step 14": 96px ring, then the finding chips 16px below */
          <div className="flex flex-col items-center gap-4">
            <MatchRing value={75} />
            <div className="flex flex-wrap justify-center gap-2">
              <span className="flex h-6 items-center rounded px-2 text-caption text-danger bg-danger-soft">2 מסמכים חסרים</span>
              <span className="flex h-6 items-center rounded px-2 text-caption text-danger bg-danger-soft">3 סעיפים חסרים</span>
              <span className="flex h-6 items-center rounded bg-[#FEFAF5] px-2 text-caption text-warn">מחיר גבוה ב-5%</span>
            </div>
          </div>
        )}

        <InfoCard icon={<Icon name="money" />} title="הערכת עלויות" sub="המחיר שהציע הקבלן לעומת מחיר השוק עבור עבודה דומה באזורכם.">
          <dl className="flex flex-col gap-2 text-body">
            <Row k="הצעת הקבלן" v={ils(420000)} />
            <Divider />
            <Row k="מחיר שוק משוקלל" v={ils(399000)} />
            <Divider />
            <Row k="הפרש" v={<span className="text-warn" dir="ltr">-21,000 ₪</span>} />
          </dl>
          {!two && (
            <p className="flex items-center justify-center gap-2 text-body">
              <Icon name="bulb" size={16} className="text-accent" /> כדאי לבקש הצעה מקבלן נוסף להשוואה
            </p>
          )}
        </InfoCard>

        <InfoCard icon={<Icon name="task" />} title="ביצוע תכנית אדריכלית" sub="סעיפים מהתכנית שהקבלן לא התייחס אליהם בהצעת המחיר.">
          <Bullets items={['לא כלול: טיפול בחלונות ודלתות', 'לא כלול: פירוט כמויות בצנרת']} />
        </InfoCard>

        <InfoCard icon={<Icon name="notice" />} title="מסמכים נדרשים" sub="מסמכים שנדרשים לצורך חוזה מחייב.">
          <Bullets items={['פירוט סופי רשתות חשמל', 'כתב כמויות / מפרט טכני', 'חסרה חתימה על תכנית אדריכלית']} />
        </InfoCard>
      </div>
      <BottomActions>
        <Button className="flex-1" onClick={() => nav('/setup/budget')}>
          אישור והמשך
        </Button>
        <Button variant="outline" className="shrink-0 px-8" onClick={() => nav('/setup/docs')}>
          תיקון
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** Figma "divider": 8px row with a thin light-blue line */
function Divider() {
  return (
    <div className="flex h-2 items-center">
      <span className="h-px w-full bg-primary-100" />
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between whitespace-nowrap">
      <dt>{k}</dt>
      <dd className="font-medium leading-4 tracking-[0.042px]">{v}</dd>
    </div>
  );
}

/** Figma "sign in - level card": icon, label + H3 title, edit button; then budget | tasks | time split by thin lines */
export function SplitCard({ icon, label, title, budget, tasks, duration, onEdit, soft }: { icon: ReactNode; label?: string; title: string; budget: number; tasks: number | string; duration: string; onEdit?: () => void; soft?: boolean }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-lg p-4', soft ? 'bg-bg' : 'border border-primary-100')}>
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-primary">{icon}</span>
        <div className="flex-1">
          {label && <p className="text-lg leading-6">{label}</p>}
          <h3 className="font-display text-h3 font-bold">{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="grid h-6 w-6 shrink-0 self-start place-items-center rounded-full bg-primary-50" aria-label={`עריכת ${title}`}>
            <Icon name="sEdit" />
          </button>
        )}
      </div>
      <div className="flex items-stretch justify-center gap-4 text-center text-body">
        <Stat k="תקציב" v={ils(budget)} />
        <span className="w-px bg-primary-100" />
        <Stat k="משימות" v={String(tasks)} />
        <span className="w-px bg-primary-100" />
        <Stat k="זמן עבודה" v={duration} />
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 whitespace-nowrap">
      <p className="text-muted">{k}</p>
      <p className="font-medium leading-4 tracking-[0.042px]">{v}</p>
    </div>
  );
}

/** הקמת פרויקט 4/4 – חלוקה תקציבית (login-step 7) */
export function BudgetSplit() {
  const nav = useNavigate();
  const { s } = useStore();
  const total = s.stages.reduce((a, st) => a + st.budget, 0) + s.extras.reduce((a, e) => a + e.amount, 0);
  const tasks = s.stages.reduce((a, st) => a + st.tasks.length, 0);
  return (
    <SubScreen title="הקמת פרויקט" step={{ n: 4, of: 4 }}>
      <Heading title="חלוקה תקציבית" sub="חילקנו את הפרויקט לשלבים עיקריים לפי סדר הביצוע" />
      <div className="flex flex-col gap-10 px-6 short:gap-6">
        <div className="flex flex-col gap-6 short:gap-4">
          {s.stages.map((st) => (
            <SplitCard
              key={st.id}
              icon={<StageGlyph icon={st.icon} />}
              label={stageLabel(st.order)}
              title={st.name}
              budget={st.budget}
              tasks={st.tasks.length}
              duration={st.duration}
              onEdit={() => nav(`/setup/stage/${st.id}`)}
            />
          ))}
          {s.extras.map((e) => (
            <SplitCard key={e.id} icon={<Icon name="addBudget" />} label="הוצאות נוספות" title={e.title} budget={e.amount} tasks={e.tasks ?? 0} duration={e.duration ?? '0'}/>
          ))}
          <SplitCard soft icon={<General />} title="סיכום כללי" budget={total} tasks={tasks} duration={`${Math.ceil(s.stages.length * 1.5)} שבועות`} />
        </div>
        <p className="text-center text-body text-muted">הסכומים וגם הזמנים משוערים, ייתכנו שינויים במהלך העבודה</p>
      </div>
      <BottomActions>
        <Button className="flex-1" onClick={() => nav('/setup/inspiration')}>
          הקמת הפרויקט
        </Button>
        <Button variant="outline" className="shrink-0 px-8" onClick={() => nav('/setup/expense')}>
          הוצאה נוספת
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
