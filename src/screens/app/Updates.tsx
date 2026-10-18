import { CheckCircle2, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, Chip, ConfirmDialog, Lightbox, Modal, PhotoPicker, Select, TextArea } from '@/components/ui';
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
      <div className={cn('mt-3 grid gap-2', srcs.length > 1 && 'grid-cols-2')}>
        {srcs.slice(0, 4).map((src, i) => (
          <button key={i} onClick={() => setOpen(i)} className="relative overflow-hidden rounded-lg">
            <img src={src} alt="" className={cn('w-full object-cover', srcs.length > 1 ? 'aspect-square' : 'aspect-[4/3]')} />
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

  const header = (
    <div className="flex items-start gap-3">
      <Avatar src={u.avatar} name={u.author} />
      <div className="flex-1">
        <p className="text-body font-medium">{u.author}</p>
        <p className="text-caption text-muted">
          {u.authorTitle} · {u.time}
        </p>
      </div>
      {stage && <Chip>{stage.name.split(' ')[0]}</Chip>}
    </div>
  );

  const comments = u.comments.length > 0 && (
    <div className="mt-3 space-y-2">
      {u.comments.map((c) => (
        <p key={c.id} className={cn('w-fit max-w-[85%] rounded-lg px-3 py-2 text-body', c.mine ? 'bg-primary-100' : 'mr-auto bg-bg')}>
          {c.text}
        </p>
      ))}
    </div>
  );

  const composer = (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="כתוב כאן" className="field py-2" />
      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50" aria-label="שליחה">
        <Send size={18} className="-scale-x-100" />
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
      <article className={cn('rounded-2xl p-4 shadow-blue', compact && u.status === 'pending' ? 'border border-accent bg-primary-50' : 'bg-white')}>
        {header}
        <p className={cn('mt-3 text-body', compact && 'line-clamp-2')}>{u.text}</p>
        {!compact && <Photos srcs={photosOf(u)} />}
        {!compact && thread && comments}
        {!compact && thread && composer}
        <div className="mt-4 flex items-center justify-center gap-3">
          {canApprove ? (
            <Button size="sm" className="min-w-[100px]" onClick={() => setConfirm(true)}>
              אישור
            </Button>
          ) : (
            status
          )}
          {compact ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              צפה בעידכון
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setThread(!thread)}>
              {thread ? 'סגירה' : u.comments.length ? `הערות (${u.comments.length})` : 'הוסף הערה'}
            </Button>
          )}
        </div>
      </article>

      <Modal open={open} onClose={() => setOpen(false)}>
        {header}
        <p className="mt-3 text-body">{u.text}</p>
        <Photos srcs={photosOf(u)} />
        {comments}
        {composer}
        <div className="mt-4 flex justify-center gap-3">{canApprove ? <Button onClick={() => setConfirm(true)}>אישור</Button> : status}</div>
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
      <AppBar title="" />
      <main className="animate-fade-up space-y-5 px-6 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-h1 font-bold">עידכונים</h1>
          {pending.length > 0 && (
            <span className="rounded bg-warn px-2 py-1 text-caption font-medium text-white">
              {pending.length} {pending.length === 1 ? 'ממתין' : 'ממתינים'} {s.user.role === 'client' ? 'לאישורך' : 'לאישור'}
            </span>
          )}
        </div>
        <div className="flex justify-center">
          <Button onClick={() => nav('/app/updates/new')}>הוספת עידכון</Button>
        </div>
        <div className="flex rounded-full bg-primary-50 p-1">
          {(['pending', 'done'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('h-9 flex-1 rounded-full text-body', tab === t ? 'bg-white font-medium shadow-blue' : 'text-muted')}>
              {t === 'pending' ? `ממתינים (${pending.length})` : 'טופלו'}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {list.map((u) => (
            <UpdateCard key={u.id} u={u} />
          ))}
          {!list.length && <p className="py-8 text-center text-body text-muted">{tab === 'pending' ? 'אין עדכונים שממתינים 🎉' : 'אין עדכונים כאן'}</p>}
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
      <div className="space-y-5 px-6">
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
      <div className="space-y-5 px-6">
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
