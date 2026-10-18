import { AlertTriangle, ClipboardList, Lightbulb, Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, SubScreen } from '@/components/layout';
import { General, MoneyBag, StageGlyph } from '@/components/icons';
import { BottomActions, Button, Field, IconButton, Pills, UploadSlot } from '@/components/ui';
import { useStore } from '@/data/store';
import type { ProjectType } from '@/data/types';
import { pickDocument } from '@/lib/files';
import { cn, ils, stageLabel } from '@/lib/format';
import { ClearField } from './Auth';

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
      <div className="space-y-5 px-6">
        <Field label="שם הפרויקט" value={name} onChange={(e) => setName(e.target.value)} placeholder="כתוב כאן" />
        <div>
          <p className="mb-2 text-caption text-muted">פירוט על הפרויקט, מה בונים?</p>
          <Pills options={types} value={type} onChange={setType} />
        </div>
        <Field label="תיאור נוסף (לא חובה)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="כתוב כאן" />
        <Field label="כתובת הנכס" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="רחוב, מספר, עיר" />
        <div>
          <span className="mb-1 block text-caption text-muted">תקציב משוער (לא חובה)</span>
          <ClearField value={budget} onChange={(v) => setBudget(v.replace(/\D/g, ''))} placeholder="₪" />
        </div>
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
      <div className="space-y-6 px-6">
        <div>
          <p className="mb-3 text-lg">
            הצעת מחיר קבלן <span className="text-body text-muted">(ניתן להוסיף עד 2 לבדיקה)</span>
          </p>
          <div className="grid grid-cols-2 gap-4">{quotes.map((_, i) => slot(quotes, setQuotes, i))}</div>
        </div>
        <div>
          <p className="mb-3 text-lg">תוכניות אדריכליות</p>
          <div className="grid grid-cols-2 gap-4">{plans.map((_, i) => slot(plans, setPlans, i))}</div>
        </div>
        <p className="text-center text-body text-muted">
          לאחר העלאת המסמכים, נשווה בין דרישות האדריכל לבין הצעות המחיר של הקבלנים. נבדוק עבורך שכל הסעיפים קיימים, נזהה הבדלי ניסוח וכמובן נבדוק מחירים
        </p>
      </div>
      <BottomActions>
        <Button
          block
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

function InfoCard({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-primary-100 bg-white p-4">
      <div className="mb-3 flex gap-3">
        <span className="mt-1 text-ink">{icon}</span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-body text-ink">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pr-2">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2 text-body">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> {t}
        </li>
      ))}
    </ul>
  );
}

function MatchRing({ value, size = 104 }: { value: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F2F7FE" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#3DA5F4" strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-h3 font-semibold">{value}%</div>
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
      <div className="space-y-4 px-6">
        {two ? (
          <>
            <div className="flex justify-center gap-8">
              {[
                { l: 'קבלן א’', n: 'דן שם טוב', v: 82, best: true },
                { l: 'קבלן ב’', n: 'האחים חסיד', v: 67 },
              ].map((q) => (
                <div key={q.l} className={cn('flex flex-col items-center gap-2 rounded-lg p-3', q.best && 'bg-primary-50')}>
                  <MatchRing value={q.v} size={96} />
                  <span className="text-body font-medium">{q.l}</span>
                  <span className="text-caption text-muted">{q.n}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-accent-soft p-4">
              <p className="text-lg font-semibold">המלצת המערכת: קבלן א’</p>
              <p className="text-body">למרות שמחירו גבוה יותר ב-₪35,000 — הצעתו מכסה את התכנית האדריכלית בצורה מלאה יותר ואין בה סעיפים פתוחים.</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <MatchRing value={75} />
            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded bg-warn-soft px-2 py-1 text-caption text-warn">מחיר גבוה ב-5%</span>
              <span className="rounded bg-danger-soft px-2 py-1 text-caption text-danger">3 סעיפים חסרים</span>
              <span className="rounded bg-danger-soft px-2 py-1 text-caption text-danger">2 מסמכים חסרים</span>
            </div>
          </div>
        )}

        <InfoCard icon={<MoneyBag size={22} />} title="הערכת עלויות" sub="המחיר שהציע הקבלן לעומת מחיר השוק עבור עבודה דומה באזורכם.">
          <dl className="divide-y divide-line text-body">
            <Row k="הצעת הקבלן" v={ils(420000)} />
            <Row k="מחיר שוק משוקלל" v={ils(399000)} />
            <Row k="הפרש" v={<span className="text-warn" dir="ltr">-₪ 21,000</span>} />
          </dl>
          {!two && (
            <p className="mt-3 flex items-center justify-center gap-2 text-body">
              <Lightbulb size={16} className="text-accent" /> כדאי לבקש הצעה מקבלן נוסף להשוואה
            </p>
          )}
        </InfoCard>

        <InfoCard icon={<ClipboardList size={22} />} title="ביצוע תכנית אדריכלית" sub="סעיפים מהתכנית שהקבלן לא התייחס אליהם בהצעת המחיר.">
          <Bullets items={['לא כלול: טיפול בחלונות ודלתות', 'לא כלול: פירוט כמויות בצנרת']} />
        </InfoCard>

        <InfoCard icon={<AlertTriangle size={22} />} title="מסמכים נדרשים" sub="מסמכים שנדרשים לצורך חוזה מחייב.">
          <Bullets items={['פירוט סופי רשתות חשמל', 'כתב כמויות / מפרט טכני', 'חסרה חתימה על תכנית אדריכלית']} />
        </InfoCard>
      </div>
      <BottomActions>
        <Button className="flex-[2]" onClick={() => nav('/setup/budget')}>
          אישור והמשך
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => nav('/setup/docs')}>
          תיקון
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt>{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

export function SplitCard({ icon, label, title, budget, tasks, duration, onEdit, soft }: { icon: ReactNode; label?: string; title: string; budget: number; tasks: number | string; duration: string; onEdit?: () => void; soft?: boolean }) {
  return (
    <section className={cn('rounded-lg p-4', soft ? 'bg-primary-50' : 'border border-primary-100 bg-white')}>
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-1 text-ink">{icon}</span>
        <div className="flex-1">
          {label && <p className="text-body">{label}</p>}
          <h3 className="font-display text-h3 font-bold">{title}</h3>
        </div>
        {onEdit && (
          <IconButton onClick={onEdit} className="h-7 w-7 shadow-none" aria-label="עריכה">
            <Pencil size={14} />
          </IconButton>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-line text-center">
        <Stat k="תקציב" v={ils(budget)} />
        <Stat k="משימות" v={String(tasks)} />
        <Stat k="זמן עבודה" v={duration} />
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-body text-muted">{k}</p>
      <p className="mt-1 text-body font-semibold">{v}</p>
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
      <div className="space-y-4 px-6">
        {s.stages.map((st) => (
          <SplitCard
            key={st.id}
            icon={<StageGlyph icon={st.icon} size={22} />}
            label={stageLabel(st.order)}
            title={st.name}
            budget={st.budget}
            tasks={st.tasks.length}
            duration={st.duration}
            onEdit={() => nav(`/setup/stage/${st.id}`)}
          />
        ))}
        {s.extras.map((e) => (
          <SplitCard key={e.id} icon={<StageGlyph icon="extras" size={22} />} label="הוצאות נוספות" title={e.title} budget={e.amount} tasks={e.tasks ?? 0} duration={e.duration ?? '0'} />
        ))}
        <SplitCard soft icon={<General size={22} />} title="סיכום כללי" budget={total} tasks={tasks} duration={`${Math.ceil(s.stages.length * 1.5)} שבועות`} />
        <p className="text-center text-body text-muted">הסכומים וגם הזמנים משוערים, ייתכנו שינויים במהלך העבודה</p>
      </div>
      <BottomActions>
        <Button className="flex-[3]" onClick={() => nav('/setup/inspiration')}>
          הקמת הפרויקט
        </Button>
        <Button variant="outline" className="flex-[2]" onClick={() => nav('/setup/expense')}>
          הוצאה נוספת
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
