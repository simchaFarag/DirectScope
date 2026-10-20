import { CheckCircle2, XCircle } from 'lucide-react';
import { Icon } from '@/components/FigmaIcon';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, ConfirmDialog, Lightbox, Modal, PhotoPicker, Select, TextArea } from '@/components/ui';
import { useStore } from '@/data/store';
import type { Update } from '@/data/types';
import { cn } from '@/lib/format';

export function useStageOptions(withGeneral = true) {
  const { s } = useStore();
  return [...s.stages.map((st) => ({ value: st.id, label: st.name.split(' ')[0] })), ...(withGeneral ? [{ value: 'general', label: 'כללי' }] : [])];
}

function Photos({ srcs }: { srcs: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!srcs.length) return null;
  return (
    <>
      <div className={cn('grid w-full gap-2', srcs.length > 1 && 'grid-cols-2')}>
        {srcs.slice(0, 4).map((src, i) => (
          <button key={i} onClick={() => setOpen(i)} className="relative overflow-hidden rounded-lg">
            <img src={src} alt="" className={cn('w-full object-cover', srcs.length > 1 ? 'aspect-square' : 'h-[136px]')} />
            {i === 3 && srcs.length > 4 && <span className="absolute inset-0 grid place-items-center bg-ink/50 text-h2 text-white">+{srcs.length - 4}</span>}
          </button>
        ))}
      </div>
      <Lightbox images={srcs.map((src) => ({ src }))} index={open} onClose={() => setOpen(null)} />
    </>
  );
}

const photosOf = (u: Update) => (u.photos?.length ? u.photos : u.photo ? [u.photo] : []);

/** Update card with approve / reject and a ping-pong comment thread */
export function UpdateCard({ u, compact }: { u: Update; compact?: boolean }) {
  const { s, approveUpdate, rejectUpdate, addComment } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [thread, setThread] = useState(false);
  const [draft, setDraft] = useState('');
  const stage = s.stages.find((st) => st.id === u.stageId);
  const canApprove = s.user.role === 'client' && u.status === 'pending';

  const send = () => {
    if (!draft.trim()) return;
    addComment(u.id, draft.trim());
    setDraft('');
  };

  /** name, then "role • time" (Figma: 14 medium / 12 muted with a 2px dot) */
  const byline = (
    <div className="flex flex-col items-start gap-0">
      <p className="text-btn font-medium tracking-[0.042px]">{u.author}</p>
      <p className="flex items-center gap-1 text-caption text-muted">
        {u.authorTitle} <span className="h-0.5 w-0.5 rounded-full bg-muted" /> {u.time}
      </p>
    </div>
  );

  const header = (
    <div className="flex w-full items-start gap-2">
      <div className="flex flex-1 items-center gap-4">
        <Avatar src={u.avatar} name={u.author} />
        {byline}
      </div>
      {stage && <span className="flex h-4 items-center rounded-lg bg-primary-100 px-2 text-caption">{stage.name.split(' ')[0]}</span>}
    </div>
  );

  const comments = u.comments.length > 0 && (
    <div className="flex w-full flex-col gap-4">
      {u.comments.map((c) => (
        <p key={c.id} className={cn('w-fit max-w-[85%] rounded-lg p-2 text-body', c.mine ? 'mr-auto bg-primary-100' : 'bg-bg')}>
          {c.text}
        </p>
      ))}
    </div>
  );

  /* Figma "chat": text field + 40px send button */
  const composer = (
    <form
      className="flex w-full items-start gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="כתוב כאן" className="h-10 min-w-0 flex-1 rounded-lg border border-primary-100 bg-white px-4 text-body placeholder:text-muted focus:border-primary focus:outline-none" />
      <button className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', draft.trim() ? 'bg-primary text-white' : 'bg-bg text-ink')} aria-label="שליחה">
        <Icon name="send" className="-scale-x-100" />
      </button>
    </form>
  );

  const status =
    u.status === 'approved' ? (
      <span className="flex items-center gap-1 text-caption text-success-dark">
        <CheckCircle2 size={16} /> אושר
      </span>
    ) : u.status === 'rejected' ? (
      <span className="flex items-center gap-1 text-caption text-danger">
        <XCircle size={16} /> נדחה{u.rejectReason ? `: ${u.rejectReason}` : ''}
      </span>
    ) : (
      s.user.role !== 'client' && <span className="text-caption text-warn">ממתין לאישור</span>
    );

  return (
    <>
      {compact && u.status !== 'pending' ? (
        /* Figma "note card/old": handled update – one row, arrow opens it */
        <button onClick={() => setOpen(true)} className="flex w-full items-center gap-4 rounded-lg bg-bg px-4 py-2 text-right">
          <Avatar src={u.avatar} name={u.author} size={24} />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            {byline}
            <p className="w-full truncate text-body">{u.text}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center">
            <Icon name="gettin" />
          </span>
        </button>
      ) : compact ? (
        /* Figma "note card" (new): yellow outline, view + approve */
        <article className="flex flex-col gap-4 rounded-lg border border-accent bg-bg p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Avatar src={u.avatar} name={u.author} size={24} />
              {byline}
            </div>
            <p className="line-clamp-2 text-body">{u.text}</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            {canApprove ? (
              <Button size="sm" onClick={() => setConfirm(true)}>
                אישור
              </Button>
            ) : (
              status
            )}
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              צפה בעידכון
            </Button>
          </div>
        </article>
      ) : (
        /* Figma "info card" (מסך התראות) */
        <article className="flex flex-col items-start gap-4 rounded-2xl bg-white p-4">
          {header}
          <p className="w-full text-body">{u.text}</p>
          <Photos srcs={photosOf(u)} />
          {thread && comments}
          {thread && composer}
          <div className="flex w-full items-center justify-center gap-6">
            {canApprove ? (
              <Button size="sm" onClick={() => setConfirm(true)}>
                אישור
              </Button>
            ) : (
              status
            )}
            <Button size="sm" variant="outline" onClick={() => setThread(!thread)}>
              {thread ? 'סגירה' : u.comments.length ? `הערות (${u.comments.length})` : 'הוסף הערה'}
            </Button>
          </div>
        </article>
      )}

      {/* Figma "Popup - info card": header, text, photo, the comment bubbles, then אישור + הוסף הערה; close button on the left */}
      <Modal open={open} onClose={() => setOpen(false)} closeLeft>
        <div className="flex flex-col items-start gap-4">
          {header}
          <p className="w-full text-body">{u.text}</p>
          <Photos srcs={photosOf(u)} />
          {comments}
          {thread && composer}
          <div className="flex w-full items-center justify-center gap-6">
            {canApprove ? (
              <Button size="sm" onClick={() => setConfirm(true)}>
                אישור
              </Button>
            ) : (
              status
            )}
            <Button size="sm" variant="outline" onClick={() => setThread(!thread)}>
              {thread ? 'סגירה' : 'הוסף הערה'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="אישור העדכון"
        text={
          <>
            {u.author} · {stage?.name}
            <br />
            עדכון שיאושר יעבור לארכיון תחת "תיעוד"
          </>
        }
        onApprove={() => {
          approveUpdate(u.id);
          setOpen(false);
          toast('העדכון אושר והועבר לתיעוד');
        }}
        onReject={(reason) => {
          rejectUpdate(u.id, reason);
          setOpen(false);
          toast('העדכון נדחה ונשלח לכותב', 'info');
        }}
      />
    </>
  );
}

/** מסך התראות / עדכונים – split into waiting and approved (designer note) */
export function UpdatesScreen() {
  const nav = useNavigate();
  const { s } = useStore();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const pending = s.updates.filter((u) => u.status === 'pending');
  const list = tab === 'pending' ? pending : s.updates.filter((u) => u.status !== 'pending');
  return (
    <>
      <AppBar menuOnly />
      <main className="animate-fade-up desk space-y-8 px-6 pb-10 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-h1 font-bold tracking-[-0.28px]">עידכונים</h1>
          {pending.length > 0 && (
            <span className="flex h-6 items-center rounded bg-warn px-2 text-caption font-medium text-[#FEFAF5]">
              {pending.length} {pending.length === 1 ? 'ממתין' : 'ממתינים'} {s.user.role === 'client' ? 'לאישורך' : 'לאישור'}
            </span>
          )}
        </div>
        <div className="flex justify-center">
          <Button onClick={() => nav('/app/updates/new')}>הוספת עידכון</Button>
        </div>
        <div className="flex rounded-full bg-primary-50 p-1 lg:mx-auto lg:max-w-md">
          {(['pending', 'done'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('h-9 flex-1 rounded-full text-body', tab === t ? 'bg-white font-medium shadow-blue' : 'text-muted')}>
              {t === 'pending' ? `ממתינים (${pending.length})` : 'טופלו'}
            </button>
          ))}
        </div>
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
          {list.map((u) => (
            <UpdateCard key={u.id} u={u} />
          ))}
          {!list.length && <p className="py-8 text-center text-body text-muted lg:col-span-full">{tab === 'pending' ? 'אין עדכונים שממתינים 🎉' : 'אין עדכונים כאן'}</p>}
        </div>
      </main>
    </>
  );
}

/** עידכון חדש (iPhone 7 / 8 / 9) */
export function UpdateForm() {
  const nav = useNavigate();
  const toast = useToast();
  const [q] = useSearchParams();
  const { addUpdate } = useStore();
  const options = useStageOptions();
  const [stage, setStage] = useState(q.get('stage') ?? undefined);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  return (
    <SubScreen title="עידכון חדש" sheet>
      <Heading title="עידכון חדש" sub="תעד את ההתקדמות בשטח" />
      <div className="space-y-6 px-6">
        <Select placeholder="בחר שלב בנייה" options={options} value={stage} onChange={setStage} />
        <TextArea label="תיאור העידכון" value={text} onChange={(e) => setText(e.target.value)} placeholder="מה קרה היום בשטח? תאר את ההתקדמות, בעיות או הערות חשובות..." />
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!stage || !text}
          onClick={() => {
            addUpdate(stage!, text, photos);
            toast('העדכון נשלח');
            nav(-1);
          }}
        >
          שלח עידכון
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** הוספת תזכורת (iPhone 10) */
export function ReminderForm() {
  const nav = useNavigate();
  const toast = useToast();
  const [q] = useSearchParams();
  const { addReminder } = useStore();
  const options = useStageOptions();
  const [stage, setStage] = useState(q.get('stage') ?? undefined);
  const [text, setText] = useState('');
  return (
    <SubScreen title="הוספת תזכורת" sheet>
      <Heading title="הוספת תזכורת" sub="לא שוכחים כשכותבים" />
      <div className="space-y-6 px-6">
        <Select placeholder="בחר שלב בנייה" options={options} value={stage} onChange={setStage} />
        <TextArea label="תיאור התזכורת" value={text} onChange={(e) => setText(e.target.value)} placeholder="הערות חשובות, בדיקות ואולי גם רעיונות..." />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!stage || !text}
          onClick={() => {
            addReminder(stage!, text);
            toast('התזכורת נשמרה');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
