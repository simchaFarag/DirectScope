import { CalendarClock, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StageTabs, SubScreen, TabScreen, Heading } from '@/components/layout';
import { AvatarStack, BottomActions, Button, Chip, IconButton, Modal, PhotoSourceButtons, ProgressBar, Ring, SectionTitle, TextArea, UploadSlot } from '@/components/ui';
import { useToast } from '@/components/toast';
import { stageProgress, useStore, useTotals, type State } from '@/data/store';
import type { StageIcon, Task } from '@/data/types';
import { cn, fmtDate, ils, stageLabel } from '@/lib/format';
import { UpdateCard } from './Updates';

export function stageTabs(s: State) {
  return [
    { id: 'general', label: 'כללי', icon: 'general' as StageIcon },
    ...s.stages.map((st) => ({ id: st.id, label: st.name.split(' ')[0], icon: st.icon })),
    { id: 'extras', label: 'תוספות', icon: 'extras' as StageIcon },
  ];
}

/** Light-blue hero with a house outline, as in the Figma */
export function Hero({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-primary-200 px-6 pb-16 pt-10">
      <svg viewBox="0 0 200 140" className="absolute inset-x-0 bottom-0 mx-auto h-[85%] text-white/70" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M30 140V60L100 15l70 45v80" />
        <path d="M125 32V20h10v18" />
      </svg>
      <div className="absolute left-6 top-6 h-5 w-12 rounded-full bg-white/50 blur-[1px]" />
      <div className="absolute right-10 top-12 h-4 w-10 rounded-full bg-white/40" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ---------- זמנים – כללי (Scedual screen) ---------- */

export function Schedule() {
  const nav = useNavigate();
  const { s } = useStore();
  const t = useTotals();
  return (
    <TabScreen>
      <StageTabs items={stageTabs(s)} active="general" onSelect={(id) => id !== 'general' && nav(`/app/schedule/${id}`)} />
      <Hero>
        <div className="pt-16 text-center">
          <p className="text-body">סטטוס פרויקט</p>
          <p className="font-display text-h1 font-bold">{t.progress}% הושלמו!</p>
          <ProgressBar value={t.progress} className="mt-3" />
        </div>
      </Hero>
      <div className="animate-fade-up -mt-10 space-y-4 px-6">
        <section className="card relative p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock size={22} className="text-primary" />
            <h3 className="text-lg font-semibold">תאריכים</h3>
            <IconButton className="mr-auto h-7 w-7 shadow-none" aria-label="עריכת תאריכים" onClick={() => nav("/app/project/edit")}>
              <Pencil size={14} />
            </IconButton>
          </div>
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-line text-center">
            <div>
              <p className="text-body text-muted">התחלה</p>
              <p className="font-semibold">{fmtDate(s.project.startDate)}</p>
            </div>
            <div>
              <p className="text-body text-muted">סיום (משוער)</p>
              <p className="font-semibold text-primary">{fmtDate(s.project.endDate)}</p>
            </div>
            <div>
              <p className="text-body text-muted">כמה נשאר</p>
              <p className="font-semibold">{t.daysLeft} ימים</p>
            </div>
          </div>
        </section>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => nav('/app/stage/new')}>
            הוספת שלב
          </Button>
        </div>

        {s.stages.map((st) => (
          <button key={st.id} onClick={() => nav(`/app/schedule/${st.id}`)} className="card-soft flex w-full items-center gap-4 p-4 text-right shadow-blue">
            <div className="flex-1">
              <p className="text-body">{stageLabel(st.order)}</p>
              <p className="font-display text-h3 font-bold">{st.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <AvatarStack srcs={st.memberAvatars} />
                <span className="text-body text-muted" dir="ltr">
                  {fmtDate(st.startDate, true)} - {fmtDate(st.endDate, true)}
                </span>
              </div>
            </div>
            <Ring value={stageProgress(st)} />
          </button>
        ))}
      </div>
    </TabScreen>
  );
}

/* ---------- זמנים – שלב (Scedual screen-step 2) ---------- */

export function StageSchedule() {
  const nav = useNavigate();
  const { stageId = '' } = useParams();
  const { s } = useStore();
  const [openNote, setOpenNote] = useState<string>();
  const [completing, setCompleting] = useState<Task>();

  if (stageId === 'extras') return <ExtrasTab base="/app/schedule" />;
  const st = s.stages.find((x) => x.id === stageId);
  if (!st) return null;
  const p = stageProgress(st);
  const days = Math.max(0, Math.ceil((new Date(st.endDate).getTime() - Date.now()) / 86400000));
  const updates = s.updates.filter((u) => u.stageId === st.id);
  const reminders = s.reminders.filter((r) => r.stageId === st.id);

  return (
    <TabScreen>
      <StageTabs items={stageTabs(s)} active={st.id} onSelect={(id) => nav(id === 'general' ? '/app/schedule' : `/app/schedule/${id}`)} />
      <div key={st.id} className="animate-fade-up space-y-8 px-6 pt-4">
        <section className="text-center">
          <p className="text-body">סטטוס נוכחי:</p>
          <p className="font-display text-h1 font-bold text-primary">{p}% הושלמו!</p>
          <div className="relative mt-6">
            <Chip tone="yellow" className="absolute -top-6 left-0">
              {days} יום
            </Chip>
            <ProgressBar value={p} color="bg-primary" className="bg-primary-50" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <dl className="space-y-1 text-body">
              <div className="flex gap-6">
                <dt>תאריך התחלה:</dt>
                <dd>{fmtDate(st.startDate)}</dd>
              </div>
              <div className="flex gap-6">
                <dt>תאריך סיום:</dt>
                <dd>{fmtDate(st.endDate)}</dd>
              </div>
            </dl>
            <CalendarClock size={28} className="text-primary" strokeWidth={1.4} />
          </div>
          <Button variant="outline" className="mt-4" onClick={() => nav(`/app/stage/${st.id}/edit`)}>
            עריכת שלב
          </Button>
        </section>

        <section>
          <SectionTitle
            action={
              <IconButton onClick={() => nav(`/app/schedule/${st.id}/tasks`)} aria-label="עריכת משימות">
                <Pencil size={18} />
              </IconButton>
            }
          >
            משימות
          </SectionTitle>
          <TaskTimeline tasks={st.tasks} onTask={setCompleting} />
          <p className="mt-2 text-center text-caption text-muted">לחיצה על משימה פתוחה מסמנת אותה כבוצעה</p>
          <TaskCompleteModal stageId={st.id} task={completing} onClose={() => setCompleting(undefined)} />
        </section>

        <section>
          <SectionTitle
            action={
              <IconButton onClick={() => nav(`/app/updates/new?stage=${st.id}`)} aria-label="הוספת עדכון">
                <Plus size={18} />
              </IconButton>
            }
          >
            עידכונים
          </SectionTitle>
          {updates.length ? (
            <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2">
              {updates.map((u) => (
                <div key={u.id} className="w-[300px] shrink-0 snap-start">
                  <UpdateCard u={u} compact />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted">אין עדכונים לשלב זה עדיין</p>
          )}
        </section>

        <section>
          <SectionTitle
            action={
              <IconButton onClick={() => nav(`/app/reminder/new?stage=${st.id}`)} aria-label="הוספת תזכורת">
                <Plus size={18} />
              </IconButton>
            }
          >
            תזכורות
          </SectionTitle>
          <div className="no-scrollbar -mx-6 flex items-start gap-3 overflow-x-auto px-6 pb-2">
            {reminders.map((r) => {
              const open = openNote === r.id;
              // Tapping a long note grows it, tapping again shrinks it (designer note)
              return (
                <button
                  key={r.id}
                  onClick={() => setOpenNote(open ? undefined : r.id)}
                  className={cn(
                    'shrink-0 rounded-lg p-3 text-right text-body shadow-blue transition-all',
                    r.color === 'yellow' ? 'bg-warn-soft' : 'bg-primary-50',
                    open ? 'w-[220px]' : 'h-[110px] w-[88px] overflow-hidden',
                  )}
                >
                  <span className={cn(!open && 'line-clamp-4')}>{r.text}</span>
                </button>
              );
            })}
            {!reminders.length && <p className="text-body text-muted">אין תזכורות</p>}
          </div>
        </section>
      </div>
    </TabScreen>
  );
}

export function TaskTimeline({ tasks, onTask }: { tasks: Task[]; onTask?: (t: Task) => void }) {
  return (
    <ol className="relative space-y-4">
      {tasks.map((t, i) => (
        <li key={t.id} className="relative flex items-center gap-4" onClick={() => t.status !== 'done' && onTask?.(t)} role={onTask && t.status !== 'done' ? 'button' : undefined}>
          <span className="relative flex w-6 flex-col items-center self-stretch">
            {i < tasks.length - 1 && <span className="absolute top-1/2 h-[calc(100%+16px)] w-0.5 bg-ink" />}
            <span
              className={cn(
                'relative z-10 my-auto grid place-items-center rounded-full',
                t.status === 'done' && 'h-5 w-5 bg-ink text-white',
                t.status === 'inProgress' && 'h-6 w-6 border-2 border-accent bg-primary',
                t.status === 'todo' && 'h-5 w-5 border-2 border-ink bg-bg',
              )}
            >
              {t.status === 'done' && <Check size={12} strokeWidth={3} />}
            </span>
          </span>
          <span
            className={cn(
              'flex-1 rounded-lg px-4 py-3 text-body',
              t.status === 'done' && 'bg-line text-muted',
              t.status === 'inProgress' && 'bg-primary text-white',
              t.status === 'todo' && 'bg-primary-50',
            )}
          >
            {t.title}
          </span>
        </li>
      ))}
      {!tasks.length && <p className="text-body text-muted">אין משימות עדיין</p>}
    </ol>
  );
}

/* ---------- השלמת משימה + תיעוד ---------- */

export function TaskCompleteModal({ stageId, task, onClose }: { stageId: string; task?: Task; onClose: () => void }) {
  const { s, completeTask } = useStore();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string>();
  const contractor = s.user.role === 'contractor';
  const close = () => {
    setNote('');
    setPhoto(undefined);
    onClose();
  };
  const done = () => {
    completeTask(stageId, task!.id, note || undefined, photo);
    toast(contractor ? 'המשימה סומנה – הלקוח קיבל התראה' : note || photo ? 'המשימה הושלמה ותועדה' : 'המשימה הושלמה');
    close();
  };
  return (
    <Modal open={!!task} onClose={close} title="השלמת משימה">
      <div className="space-y-4">
        <p className="rounded-lg bg-primary-50 p-3 text-body font-medium">{task?.title}</p>
        <TextArea label="תיעוד (לא חובה)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="מה בוצע? הערות לבדיקה..." max={300} />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-lg font-medium">תמונה</span>
            <PhotoSourceButtons onPick={(imgs) => setPhoto(imgs[0])} />
          </div>
          {photo && <UploadSlot filled={photo} onAdd={() => {}} onRemove={() => setPhoto(undefined)} />}
        </div>
        <Button block onClick={done}>
          סימון כבוצע
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- עריכת משימות ---------- */

export function TasksEdit() {
  const nav = useNavigate();
  const toast = useToast();
  const { stageId = '' } = useParams();
  const { s, setTasks } = useStore();
  const st = s.stages.find((x) => x.id === stageId);
  const [draft, setDraft] = useState('');
  const [completing, setCompleting] = useState<Task>();
  if (!st) return null;
  const tasks = st.tasks;
  const set = (next: Task[]) => setTasks(st.id, next);

  // todo → inProgress → (done via documentation popup); tapping a done task reopens it
  const cycle = (t: Task) => {
    if (t.status === 'inProgress') return setCompleting(t);
    set(tasks.map((x) => (x.id === t.id ? { ...x, status: t.status === 'todo' ? 'inProgress' : 'todo' } : x)));
  };
  const groups = [
    { title: 'הושלמו', items: tasks.filter((t) => t.status === 'done') },
    { title: 'בתהליך', items: tasks.filter((t) => t.status === 'inProgress') },
    { title: 'לביצוע', items: tasks.filter((t) => t.status === 'todo') },
  ];

  return (
    <SubScreen title="עריכת משימות" sheet>
      <Heading title="עריכת משימות" sub={`${stageLabel(st.order)} ${st.name} · לחיצה על משימה מקדמת את הסטטוס`} />
      <div className="space-y-6 px-6">
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.title}>
                <p className="mb-2 text-body font-medium">{g.title}</p>
                <div className="space-y-2">
                  {g.items.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <button
                        onClick={() => cycle(t)}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-right text-body',
                          t.status === 'done' ? 'bg-line text-muted line-through' : t.status === 'inProgress' ? 'bg-primary text-white' : 'bg-white shadow-blue',
                        )}
                      >
                        <span className={cn('grid h-5 w-5 place-items-center rounded border-2', t.status === 'done' ? 'border-muted bg-muted text-white' : 'border-current')}>
                          {t.status === 'done' && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="flex-1">
                          {t.title}
                          {t.note && <span className="block text-caption no-underline">📝 {t.note}</span>}
                        </span>
                        {t.photo && <img src={t.photo} alt="" className="h-8 w-8 rounded object-cover" />}
                      </button>
                      {t.status !== 'done' && (
                        <button onClick={() => setCompleting(t)} className="p-2 text-primary" aria-label="סימון כבוצע">
                          <Check size={18} />
                        </button>
                      )}
                      <button onClick={() => set(tasks.filter((x) => x.id !== t.id))} className="p-2 text-muted" aria-label="מחיקה">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
        )}
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="משימה חדשה" className="field" />
          <Button
            variant="outline"
            disabled={!draft}
            onClick={() => {
              set([...tasks, { id: Math.random().toString(36).slice(2), title: draft, status: 'todo' }]);
              setDraft('');
            }}
          >
            הוסף משימה
          </Button>
        </div>
      </div>
      <BottomActions>
        <Button
          block
          onClick={() => {
            toast('השינויים נשמרו');
            nav(-1);
          }}
        >
          שמור שינויים
        </Button>
      </BottomActions>
      <TaskCompleteModal stageId={st.id} task={completing} onClose={() => setCompleting(undefined)} />
    </SubScreen>
  );
}

/* ---------- תוספות (extra expenses) tab ---------- */

export function ExtrasTab({ base }: { base: string }) {
  const nav = useNavigate();
  const { s } = useStore();
  return (
    <TabScreen>
      <StageTabs items={stageTabs(s)} active="extras" onSelect={(id) => nav(id === 'general' ? base : `${base}/${id}`)} />
      <div className="animate-fade-up space-y-3 px-6 pt-4">
        <SectionTitle
          action={
            <IconButton onClick={() => nav('/app/expense/new')} aria-label="הוספת הוצאה">
              <Plus size={18} />
            </IconButton>
          }
        >
          הוצאות נוספות
        </SectionTitle>
        {s.extras.map((e) => (
          <div key={e.id} className="card flex items-center justify-between p-4">
            <span className="text-lg font-medium">{e.title}</span>
            <span className="font-semibold">{ils(e.amount)}</span>
          </div>
        ))}
      </div>
    </TabScreen>
  );
}
