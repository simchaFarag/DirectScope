import { Plus } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StageTabs, SubScreen, TabScreen, Heading } from '@/components/layout';
import { Icon } from '@/components/FigmaIcon';
import { AvatarStack, VDivider, BottomActions, Button, IconButton, Modal, PhotoSourceButtons, ProgressBar, Ring, SectionTitle, TextArea, UploadSlot } from '@/components/ui';
import { useToast } from '@/components/toast';
import { stageProgress, useStore, useTotals, type State } from '@/data/store';
import type { StageIcon, Task } from '@/data/types';
import { cn, fmtDate, ils, stageLabel } from '@/lib/format';
import { pickImages } from '@/lib/files';
import { UpdateCard } from './Updates';

export function stageTabs(s: State) {
  return [
    { id: 'general', label: 'כללי', icon: 'general' as StageIcon },
    ...s.stages.map((st) => ({ id: st.id, label: st.name.split(' ')[0], icon: st.icon })),
    { id: 'extras', label: 'תוספות', icon: 'extras' as StageIcon },
  ];
}

/**
 * Light-blue hero from the Figma. The blue block runs on under the content that follows it (a card / the first cards),
 * so whatever comes after the hero must be `relative`.
 * - house: זמנים – 342px of blue with the house + trees illustration behind the bottom of the hero
 * - clouds: תקציב – 468px of blue (556 from the top of the screen) with clouds and a tree
 */
export function Hero({ children, variant = 'house' }: { children: React.ReactNode; variant?: 'house' | 'clouds' }) {
  return (
    <div className="relative lg:mx-6 lg:rounded-3xl">
      <div className={cn('absolute inset-x-0 top-0 bg-primary-200 lg:rounded-3xl', variant === 'house' ? 'h-[342px]' : 'h-[468px]')} />
      {variant === 'house' ? (
        <img src="/img/hero-house.svg" alt="" className="absolute bottom-0 left-[9%] w-[82%]" />
      ) : (
        <>
          <img src="/img/clouds.svg" alt="" className="absolute left-[19%] top-6 w-[62%]" />
          <img src="/img/tree.svg" alt="" className="absolute left-[74%] top-[330px] w-[5.4%]" />
        </>
      )}
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
    <TabScreen white>
      <StageTabs items={stageTabs(s)} active="general" onSelect={(id) => id !== 'general' && nav(`/app/schedule/${id}`)} />
      <Hero>
        <div className="flex h-64 flex-col justify-end gap-2 px-6 py-4 text-center lg:mx-auto lg:max-w-xl lg:pt-10">
          <div className="flex flex-col gap-0.5">
            <p className="text-lg">סטטוס פרויקט</p>
            <p className="font-display text-[24px] font-bold leading-[28px]">{t.progress}% הושלמו!</p>
          </div>
          <ProgressBar value={t.progress} />
        </div>
      </Hero>
      <div className="animate-fade-up relative mt-4 flex flex-col items-center gap-4 px-6">
        {/* Figma "level card" – dates */}
        <section className="relative flex w-full flex-col justify-center gap-4 rounded-lg border border-primary-100 bg-white p-4 lg:mx-auto lg:max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex flex-1 items-center gap-4">
              <Icon name="date" className="text-primary" />
              <h3 className="flex-1 text-lg font-semibold leading-5">תאריכים</h3>
            </div>
            <button className="grid h-6 w-6 place-items-center rounded-full bg-primary-50" aria-label="עריכת תאריכים" onClick={() => nav('/app/project/edit')}>
              <Icon name="sEdit" />
            </button>
          </div>
          <div className="flex items-start gap-4 whitespace-nowrap text-center text-body">
            <div className="flex flex-col gap-1.5">
              <p>התחלה</p>
              <p className="text-btn font-medium tracking-[0.042px]">{fmtDate(s.project.startDate)}</p>
            </div>
            <VDivider />
            <div className="flex flex-col gap-1.5">
              <p>סיום (משוער)</p>
              <p className="text-btn font-medium tracking-[0.042px] text-primary">{fmtDate(s.project.endDate)}</p>
            </div>
            <VDivider />
            <div className="flex flex-col gap-1.5">
              <p>כמה נשאר</p>
              <p className="text-btn font-medium tracking-[0.042px]">{t.workDaysLeft} ימי עסקים</p>
            </div>
          </div>
        </section>

        <Button variant="outline" onClick={() => nav('/app/stage/new')}>
          הוספת שלב
        </Button>

        <div className="w-full space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {s.stages.map((st) => (
          <button key={st.id} onClick={() => nav(`/app/schedule/${st.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-bg p-4 text-right shadow-yellow">
            <div className="flex flex-1 flex-col gap-2">
              <div>
                <p className="text-lg">{stageLabel(st.order)}</p>
                <p className="font-display text-h3 font-bold">{st.name}</p>
              </div>
              <div className="flex items-end gap-4">
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
    <TabScreen white>
      <StageTabs items={stageTabs(s)} active={st.id} onSelect={(id) => nav(id === 'general' ? '/app/schedule' : `/app/schedule/${id}`)} />
      <div key={st.id} className="animate-fade-up space-y-10 px-6 pt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:space-y-0">
        <section className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-lg">סטטוס נוכחי:</p>
              <p className="font-display text-[24px] font-bold leading-[28px] text-primary">{p}% הושלמו!</p>
            </div>
            <div className="flex w-full flex-col items-start">
              <span className="flex h-4 items-center rounded-lg bg-accent px-2 text-caption text-white">{days} יום</span>
              <ProgressBar value={p} color="bg-primary" className="bg-bg" />
            </div>
            <div className="flex items-center gap-4">
              <Icon name="date" size={32} className="text-primary" />
              <div className="flex flex-col gap-2 whitespace-nowrap text-body">
                <p className="flex gap-2">
                  <span>תאריך התחלה:</span>
                  <span>{fmtDate(st.startDate)}</span>
                </p>
                <p className="flex gap-2">
                  <span>תאריך סיום:</span>
                  <span className="flex-1 text-left">{fmtDate(st.endDate)}</span>
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => nav(`/app/stage/${st.id}/edit`)}>
            עריכת שלב
          </Button>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHead title="משימות">
            <SmallIconButton onClick={() => nav(`/app/schedule/${st.id}/tasks`)} aria-label="עריכת משימות">
              <Icon name="edit" size={18} />
            </SmallIconButton>
          </SectionHead>
          <TaskTimeline tasks={st.tasks} onTask={setCompleting} />
          <TaskCompleteModal stageId={st.id} task={completing} onClose={() => setCompleting(undefined)} />
        </section>

        <section className="flex flex-col gap-2">
          <SectionHead title="עידכונים" />
          {updates.length ? (
            <div className="no-scrollbar -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {updates.map((u) => (
                <div key={u.id} className="w-[320px] shrink-0 snap-start lg:w-full">
                  <UpdateCard u={u} compact />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted">אין עדכונים לשלב זה עדיין</p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <SectionHead title="תזכורות">
            <SmallIconButton onClick={() => nav(`/app/reminder/new?stage=${st.id}`)} aria-label="הוספת תזכורת">
              <Icon name="addThin" />
            </SmallIconButton>
          </SectionHead>
          <div className="no-scrollbar -mx-6 flex items-start gap-4 overflow-x-auto px-6 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {reminders.map((r) => {
              const open = openNote === r.id;
              // Tapping a long note grows it, tapping again shrinks it (designer note)
              return (
                <button
                  key={r.id}
                  onClick={() => setOpenNote(open ? undefined : r.id)}
                  className={cn(
                    'shrink-0 rounded-lg p-2 text-right text-body transition-all',
                    r.color === 'yellow' ? 'bg-warn-soft' : 'bg-primary-50',
                    open ? 'w-[220px]' : 'flex h-24 w-20 items-center overflow-hidden',
                  )}
                >
                  <span className={cn(!open && 'line-clamp-3')}>{r.text}</span>
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

/** Figma "dot": done = dark with a check, current = blue with a yellow ring, upcoming = dark ring */
function TimelineDot({ status }: { status: Task['status'] }) {
  if (status === 'done')
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-ink text-bg">
          <Icon name="checkmark" size={12} />
        </span>
      </span>
    );
  if (status === 'inProgress')
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] border-accent">
        <span className="h-4 w-4 rounded-full bg-primary" />
      </span>
    );
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center">
      <span className="h-[15.5px] w-[15.5px] rounded-full border-[1.5px] border-ink" />
    </span>
  );
}

/** Section title (18px display) with an optional 32px icon button on the left */
export function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between">
      <h2 className="font-display text-h3 font-bold">{title}</h2>
      {children}
    </div>
  );
}

/** Figma "icon buttoms" size=32, bg=yes */
export function SmallIconButton({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-ink shadow-[0_0_5px_rgba(62,165,244,0.1)]', className)} />;
}

export function TaskTimeline({ tasks, onTask }: { tasks: Task[]; onTask?: (t: Task) => void }) {
  return (
    <ol className="relative">
      {tasks.map((t, i) => (
        /* Figma "Timeline Item": dot column (4px from the top, 32px connector under the dot) + level card */
        <li key={t.id} className="relative flex items-start gap-4" onClick={() => t.status !== 'done' && onTask?.(t)} role={onTask && t.status !== 'done' ? 'button' : undefined}>
          <span className="flex w-6 shrink-0 flex-col items-center pt-1">
            <TimelineDot status={t.status} />
            {i < tasks.length - 1 && <span className="h-8 w-[1.5px] rounded-full bg-ink" />}
          </span>
          <span
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-body',
              t.status === 'done' && 'bg-line text-muted',
              t.status === 'inProgress' && 'bg-primary text-white',
              t.status === 'todo' && 'bg-bg',
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
  const [editing, setEditing] = useState<string>();
  const [completing, setCompleting] = useState<Task>();
  if (!st) return null;
  const tasks = st.tasks;
  const set = (next: Task[]) => setTasks(st.id, next);

  // todo → inProgress → (done via documentation popup); tapping a done task reopens it
  const cycle = (t: Task) => {
    if (t.status === 'inProgress') return setCompleting(t);
    set(tasks.map((x) => (x.id === t.id ? { ...x, status: t.status === 'todo' ? 'inProgress' : 'todo' } : x)));
  };
  const rename = (id: string, title: string) => {
    setEditing(undefined);
    set(title.trim() ? tasks.map((x) => (x.id === id ? { ...x, title: title.trim() } : x)) : tasks.filter((x) => x.id !== id));
  };
  const addPhoto = (t: Task) => pickImages({ capture: true }).then(([photo]) => photo && set(tasks.map((x) => (x.id === t.id ? { ...x, photo } : x))));
  // Figma groups: "הושלמו", then "בתהליך" holding the current task and the ones still ahead
  const groups = [
    { title: 'הושלמו', items: tasks.filter((t) => t.status === 'done') },
    { title: 'בתהליך', items: [...tasks.filter((t) => t.status === 'inProgress'), ...tasks.filter((t) => t.status === 'todo')] },
  ];

  return (
    <SubScreen title="עריכת משימות" sheet>
      <Heading title="עריכת משימות" sub={`${stageLabel(st.order)} ${st.name}`} />
      <div className="flex flex-col gap-6 px-6">
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <Fragment key={g.title}>
                <p className="px-2 text-caption">{g.title}</p>
                {g.items.map((t) => (
                  /* Figma "edit tasks - text field": checkbox, text, then camera / edit / delete */
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center rounded-lg px-4 py-2',
                      t.status === 'done' ? 'gap-4 bg-line' : t.status === 'inProgress' ? 'gap-2 border-2 border-primary bg-bg' : 'gap-2 bg-bg',
                    )}
                  >
                    <button
                      onClick={() => (t.status === 'done' ? set(tasks.map((x) => (x.id === t.id ? { ...x, status: 'todo' } : x))) : setCompleting(t))}
                      className="grid h-6 w-6 shrink-0 place-items-center"
                      aria-label={t.status === 'done' ? 'החזרה לביצוע' : 'סימון כבוצע'}
                    >
                      <span className={cn('grid h-4 w-4 place-items-center rounded-sm', t.status === 'done' ? 'bg-primary text-white' : 'border border-[#BFC4CD] bg-white')}>
                        {t.status === 'done' && <Icon name="checkmark" />}
                      </span>
                    </button>
                    {editing === t.id ? (
                      <input
                        autoFocus
                        defaultValue={t.title}
                        onBlur={(e) => rename(t.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        aria-label="שם המשימה"
                        className="min-w-0 flex-1 bg-transparent text-body focus:outline-none"
                      />
                    ) : (
                      <button onClick={() => cycle(t)} className={cn('min-w-0 flex-1 text-right text-body', t.status === 'done' && 'text-muted')}>
                        {t.title}
                        {t.note && <span className="block text-caption text-muted">{t.note}</span>}
                      </button>
                    )}
                    {t.photo && <img src={t.photo} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />}
                    <div className="flex shrink-0 items-start gap-2">
                      <button onClick={() => addPhoto(t)} className="grid h-6 w-6 place-items-center" aria-label="צילום">
                        <Icon name="camera" size={16} />
                      </button>
                      <button onClick={() => setEditing(t.id)} className="grid h-6 w-6 place-items-center" aria-label="עריכה">
                        <Icon name="sEdit" />
                      </button>
                      <button onClick={() => set(tasks.filter((x) => x.id !== t.id))} className="grid h-6 w-6 place-items-center" aria-label="מחיקה">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </Fragment>
            ),
        )}
      </div>
      <BottomActions>
        <div className="flex w-full items-start gap-8">
          <Button
            className="flex-1"
            onClick={() => {
              toast('השינויים נשמרו');
              nav(-1);
            }}
          >
            שמור שינויים
          </Button>
          <Button
            variant="soft"
            className="shrink-0"
            onClick={() => {
              const id = Math.random().toString(36).slice(2);
              set([...tasks, { id, title: '', status: 'todo' }]);
              setEditing(id);
            }}
          >
            הוסף משימה
          </Button>
        </div>
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
      <div className="animate-fade-up space-y-3 px-6 pt-4 lg:mx-auto lg:max-w-2xl">
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
