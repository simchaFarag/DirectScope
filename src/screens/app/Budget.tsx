import { ArrowUpLeft, Camera, CheckCircle2, Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, StageTabs, SubScreen, TabScreen } from '@/components/layout';
import { StageGlyph } from '@/components/icons';
import { Avatar, BottomActions, Button, Checkbox, Chip, ConfirmDialog, Field, IconButton, Lightbox, Modal, PhotoPicker, ProgressBar, SectionTitle, Select, TextArea, UploadSlot } from '@/components/ui';
import { useToast } from '@/components/toast';
import { pickDocument, pickImages } from '@/lib/files';
import { stageExceptions, useStore, useTotals } from '@/data/store';
import type { ExceptionReq } from '@/data/types';
import { cn, fmtDate, ils, stageLabel } from '@/lib/format';
import { ExtrasTab, Hero, stageTabs } from './Schedule';
import { useStageOptions } from './Updates';

function BigRing({ value, children }: { value: number; children: React.ReactNode }) {
  const size = 190;
  const r = 80;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth="22" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#FFC72C" strokeWidth="22" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <div className="absolute text-center">{children}</div>
    </div>
  );
}

/* ---------- תקציב – סקירה (Budget screen) ---------- */

export function Budget() {
  const nav = useNavigate();
  const { s } = useStore();
  const t = useTotals();
  const contractor = s.user.role === 'contractor';
  const contract = s.stages.reduce((a, st) => a + st.contractAmount, 0);

  return (
    <TabScreen>
      <Hero>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-5">
            <div>
              <p className="font-display text-h3 font-bold">{contractor ? 'סכום חוזה קבלן' : 'תקציב מעודכן'}</p>
              <p className="font-display text-h2 font-bold">{ils(contractor ? contract : t.total)}</p>
            </div>
            <div>
              <p className="text-body text-muted">נותר לתשלום</p>
              <p className="text-lg font-semibold">{ils((contractor ? contract : t.total) - t.paid)}</p>
            </div>
            <div>
              <p className="text-body text-muted">חריגות אושרו</p>
              <p className="text-lg font-semibold">{ils(t.approvedEx)}</p>
              <button onClick={() => nav('/app/exceptions')} className="mt-1 flex items-center gap-1 text-caption underline">
                {s.exceptions.some((e) => e.status === 'pending') && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
                הצג אישורי חריגות ותוספות
              </button>
            </div>
          </div>
          <BigRing value={t.paid / (contractor ? contract : t.total)}>
            <p className="font-display text-[44px] font-bold leading-none">{Math.round(t.paid / 1000)}</p>
            <p className="text-lg font-semibold">אלף ש״ח</p>
            <p className="text-body">שולמו עד כה</p>
          </BigRing>
        </div>
        {!contractor && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => nav('/app/expense/new')}>
              הוספת הוצאה
            </Button>
          </div>
        )}
      </Hero>

      <div className="animate-fade-up -mt-8 space-y-4 px-6">
        {s.stages.map((st) => {
          const total = (contractor ? st.contractAmount : st.budget) + stageExceptions(s, st.id);
          return (
            <button key={st.id} onClick={() => nav(`/app/budget/${st.id}`)} className="card-soft block w-full p-4 text-right shadow-blue">
              <div className="mb-4 flex items-start gap-3">
                <StageGlyph icon={st.icon} size={22} className="mt-1" />
                <div className="flex-1">
                  <p className="text-body">{stageLabel(st.order)}</p>
                  <p className="font-display text-h3 font-bold">{st.name}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white">
                  <ArrowUpLeft size={18} className="text-primary" />
                </span>
              </div>
              <div className="grid grid-cols-3 text-center text-body">
                <div>
                  <p className="text-muted">שולמו</p>
                  <p className="font-semibold">{ils(st.paid)}</p>
                </div>
                <div>
                  <p className="text-muted">יתרה</p>
                  <p className="font-semibold">{ils(total - st.paid)}</p>
                </div>
                <div>
                  <p className="text-muted">סה״כ</p>
                  <p className="font-semibold">{ils(total)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </TabScreen>
  );
}

/* ---------- תקציב – שלב (Budget screen - step 2) ---------- */

export function StageBudget() {
  const nav = useNavigate();
  const { stageId = '' } = useParams();
  const { s, toggleShopping, addShopping, removeShopping, updateShopping } = useStore();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string>();
  const [shopPhoto, setShopPhoto] = useState<string>();
  const [adding, setAdding] = useState(false);

  if (stageId === 'extras') return <ExtrasTab base="/app/budget" />;
  const st = s.stages.find((x) => x.id === stageId);
  if (!st) return null;
  const contractor = s.user.role === 'contractor';
  const ex = stageExceptions(s, st.id);
  const total = (contractor ? st.contractAmount : st.budget) + ex;
  const shopping = s.shopping.filter((x) => x.stageId === st.id);
  const exceptions = s.exceptions.filter((x) => x.stageId === st.id && x.status === 'pending');
  const receipts = s.receipts.filter((x) => x.stageId === st.id);

  return (
    <TabScreen>
      <StageTabs items={stageTabs(s)} active={st.id} onSelect={(id) => nav(id === 'general' ? '/app/budget' : `/app/budget/${id}`)} />
      <div key={st.id} className="animate-fade-up space-y-8 px-6 pt-4">
        <section className="text-center">
          <p className="text-body">סטטוס תקציב:</p>
          <p className="font-display text-h1 font-bold text-primary">{ils(st.paid)}</p>
          <p className="text-body">שולמו עד כה</p>
          <div className="relative mt-6">
            <Chip tone="yellow" className="absolute -top-6 left-0">
              {Math.round((total - st.paid) / 1000)} אש״ח
            </Chip>
            <ProgressBar value={total ? (st.paid / total) * 100 : 0} color="bg-primary" className="bg-primary-50" />
          </div>
          <dl className="mt-4 divide-y divide-line text-body">
            <Line k="סה״כ מעודכן:" v={ils(total)} />
            <Line k="יתרה לתשלום:" v={ils(total - st.paid)} />
            <Line k="סך חריגות (אושרו):" v={ils(ex)} />
            <Line k="סכום חוזה קבלן:" v={ils(st.contractAmount)} />
          </dl>
          {!contractor && (
            <Button variant="outline" className="mt-4" onClick={() => nav(`/app/stage/${st.id}/edit`)}>
              עריכת שלב
            </Button>
          )}
        </section>

        <section>
          <SectionTitle
            action={
              <IconButton onClick={() => setAdding(true)} aria-label="הוספת פריט">
                <Plus size={18} />
              </IconButton>
            }
          >
            רשימת קניות
          </SectionTitle>
          <div className="space-y-2">
            {shopping.map((it) => (
              <div key={it.id} className={cn('flex items-center gap-3 rounded-lg px-4 py-3', it.done ? 'bg-line' : 'bg-white shadow-blue')}>
                <Checkbox checked={it.done} onChange={() => toggleShopping(it.id)} />
                {editing === it.id ? (
                  <input
                    autoFocus
                    defaultValue={it.title}
                    onBlur={(e) => {
                      if (e.target.value.trim()) updateShopping(it.id, { title: e.target.value.trim() });
                      setEditing(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="flex-1 rounded border border-primary-200 px-2 text-body focus:outline-none"
                    aria-label="עריכת פריט"
                  />
                ) : (
                  <span className={cn('flex-1 text-body', it.done && 'text-muted')}>{it.title}</span>
                )}
                {it.photo && (
                  <button onClick={() => setShopPhoto(it.photo!)} aria-label="צפייה בתמונה">
                    <img src={it.photo} alt="" className="h-7 w-7 rounded object-cover" />
                  </button>
                )}
                <button onClick={() => pickImages({ capture: true }).then(([p]) => p && updateShopping(it.id, { photo: p }))} aria-label="צילום פריט">
                  <Camera size={16} className="text-muted" />
                </button>
                <button onClick={() => setEditing(it.id)} aria-label="עריכת פריט">
                  <Pencil size={16} className="text-muted" />
                </button>
                <button onClick={() => removeShopping(it.id)} aria-label="מחיקה">
                  <Trash2 size={16} className="text-muted" />
                </button>
              </div>
            ))}
            {adding && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft) addShopping(st.id, draft);
                  setDraft('');
                  setAdding(false);
                }}
              >
                <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="field" placeholder="פריט חדש" />
                <Button variant="outline">הוסף</Button>
              </form>
            )}
          </div>
        </section>

        <section>
          <SectionTitle>חריגות לאישור</SectionTitle>
          {exceptions.length ? (
            <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
              {exceptions.map((e) => (
                <div key={e.id} className="w-[300px] shrink-0">
                  <ExceptionCard e={e} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted">אין חריגות שממתינות לאישור</p>
          )}
        </section>

        {!contractor && (
          <section>
            <SectionTitle
              action={
                <IconButton onClick={() => nav(`/app/receipt/new?stage=${st.id}`)} aria-label="הוספת אסמכתא">
                  <Plus size={18} />
                </IconButton>
              }
            >
              פירוט הוצאות
            </SectionTitle>
            <div className="space-y-3">
              {receipts.map((r) => (
                <button key={r.id} onClick={() => nav(`/app/receipts/${r.id}`)} className="card-soft flex w-full items-center gap-3 p-4 text-right">
                  <img src={r.preview ?? '/img/doc.png'} alt="" className="h-10 w-8 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-body">{r.title}</p>
                    <p className="font-semibold">{ils(r.amount)}</p>
                  </div>
                  <Chip>{fmtDate(r.date)}</Chip>
                </button>
              ))}
              {!receipts.length && <p className="text-body text-muted">אין הוצאות עדיין</p>}
            </div>
          </section>
        )}
      </div>
      <Lightbox images={shopPhoto ? [{ src: shopPhoto }] : []} index={shopPhoto ? 0 : null} onClose={() => setShopPhoto(undefined)} />
    </TabScreen>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between px-8 py-2">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/* ---------- Exception card + details popup ---------- */

export function ExceptionCard({ e }: { e: ExceptionReq }) {
  const { s, setExceptionStatus } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const stage = s.stages.find((x) => x.id === e.stageId);
  const client = s.user.role === 'client';
  return (
    <>
      <article className={cn('rounded-lg p-4', e.status === 'pending' ? 'border border-accent bg-white shadow-blue' : 'bg-[#F0F1F3] text-muted')}>
        <div className="flex items-start gap-3">
          <Avatar src={e.avatar} name={e.author} />
          <div className="flex-1">
            <p className="text-body font-medium">{e.author}</p>
            <p className="text-caption text-muted">
              {e.authorTitle} · {e.time}
            </p>
          </div>
          {stage && <Chip>{stage.name.split(' ')[0]}</Chip>}
        </div>
        <p className="mt-3 text-body">{e.title}</p>
        <p className="font-display text-h3 font-bold">{ils(e.amount)}</p>
        <div className={cn('mt-3 flex gap-3', e.status === 'pending' ? 'justify-center' : 'justify-start')}>
          {e.status === 'pending' ? (
            client ? (
              <Button size="sm" className="min-w-[100px]" onClick={() => setConfirm(true)}>
                אישור
              </Button>
            ) : (
              <span className="flex items-center gap-1 text-caption text-warn">
                <Clock3 size={16} /> ממתין לאישור
              </span>
            )
          ) : (
            <button onClick={() => setOpen(true)} className={cn('flex items-center gap-1 text-body font-medium', e.status === 'approved' ? 'text-ink' : 'text-danger')}>
              <CheckCircle2 size={16} /> {e.status === 'approved' ? 'חריגה אושרה' : 'חריגה נדחתה'}
            </button>
          )}
          {e.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              צפה בחריגה
            </Button>
          )}
        </div>
      </article>

      <Modal open={open} onClose={() => setOpen(false)} title="פרטי חריגה">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar src={e.avatar} name={e.author} />
            <div>
              <p className="text-body font-medium">{e.author}</p>
              <p className="text-caption text-muted">{e.authorTitle}</p>
            </div>
          </div>
          <p className="text-lg font-semibold">{e.title}</p>
          <p className="text-body">{e.description}</p>
          <div className="flex justify-between rounded-lg bg-primary-50 p-3 text-body">
            <span>שלב: {stage?.name}</span>
            <span className="font-semibold">{ils(e.amount)}</span>
          </div>
          {e.rejectReason && <p className="rounded-lg bg-danger-soft p-3 text-body text-danger">סיבת הדחייה: {e.rejectReason}</p>}
          {e.photos?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {e.photos.map((p, i) => (
                <button key={i} onClick={() => setPhoto(i)}>
                  <img src={p} alt="" className="aspect-square w-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="checker aspect-[4/3] rounded-lg" />
          )}
          {client && e.status === 'pending' && (
            <Button block onClick={() => setConfirm(true)}>
              אישור / דחייה
            </Button>
          )}
        </div>
      </Modal>
      <Lightbox images={(e.photos ?? []).map((src) => ({ src }))} index={photo} onClose={() => setPhoto(null)} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="אישור חריגה"
        text={
          <>
            {e.title}
            <br />
            <b className="text-ink">{ils(e.amount)}</b> יתווספו לתקציב השלב
          </>
        }
        onApprove={() => {
          setExceptionStatus(e.id, 'approved');
          setOpen(false);
          toast('החריגה אושרה ונוספה לתקציב');
        }}
        onReject={(reason) => {
          setExceptionStatus(e.id, 'rejected', reason);
          setOpen(false);
          toast('החריגה נדחתה', 'info');
        }}
      />
    </>
  );
}

/** מסך אישורי חריגה – לקוח / קבלן */
export function ExceptionsScreen() {
  const nav = useNavigate();
  const { s } = useStore();
  const contractor = s.user.role === 'contractor';
  const pending = s.exceptions.filter((e) => e.status === 'pending').length;
  return (
    <>
      <AppBar title="" />
      <main className="animate-fade-up space-y-5 px-6 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-h1 font-bold">אישורי חריגה</h1>
          {pending > 0 && (
            <span className="rounded bg-warn px-2 py-1 text-caption font-medium text-white">
              {pending} {pending === 1 ? 'ממתין' : 'ממתינים'} {contractor ? 'לאישור' : 'לאישורך'}
            </span>
          )}
        </div>
        {contractor && (
          <div className="flex justify-center">
            <Button onClick={() => nav('/app/exceptions/new')}>שליחת אישור חדש</Button>
          </div>
        )}
        <div className="space-y-4">
          {[...s.exceptions]
            .sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'))
            .map((e) => (
              <ExceptionCard key={e.id} e={e} />
            ))}
        </div>
      </main>
    </>
  );
}

/** שליחת אישור חריגה חדש (contractor) */
export function ExceptionForm() {
  const nav = useNavigate();
  const { addException } = useStore();
  const toast = useToast();
  const options = useStageOptions(false);
  const [stage, setStage] = useState<string>();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  return (
    <SubScreen title="אישור חריגה" sheet>
      <Heading title="אישור חריגה" sub="פרט את הבקשה לאישור הלקוח" />
      <div className="space-y-5 px-6">
        <Select placeholder="בחר שלב בנייה" options={options} value={stage} onChange={setStage} />
        <Field label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="תאר בקצרה למה האישור..." />
        <TextArea label="תיאור החריגה" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="מה קרה? מה לא חישבנו מראש? כתוצאה ממי זה נגרם?..." />
        <Field label="סכום" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="₪" />
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!stage || !title || !amount}
          onClick={() => {
            addException({ stageId: stage!, title, description: desc, amount: +amount, photos });
            toast('הבקשה נשלחה לאישור הלקוח');
            nav(-1);
          }}
        >
          שלח בקשה לאישור
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** הוספת אסמכתא הוצאה (חשבונית / קבלה) */
export function ReceiptForm() {
  const nav = useNavigate();
  const [q] = useSearchParams();
  const { addReceipt } = useStore();
  const toast = useToast();
  const options = useStageOptions(false);
  const [stage, setStage] = useState(q.get('stage') ?? undefined);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<{ name: string; preview?: string }>();
  return (
    <SubScreen title="הוספת חשבונית" sheet>
      <Heading title="הוספת חשבונית/קבלה" />
      <div className="space-y-5 px-6">
        {!q.get('stage') && <Select placeholder="בחר שלב בנייה" options={options} value={stage} onChange={setStage} />}
        <UploadSlot
          className="aspect-[3/2]"
          filled={file ? (file.preview ?? '/img/doc.png') : undefined}
          label={file?.name ?? 'העלאת קובץ / צילום'}
          onAdd={() => pickDocument().then((f) => f && setFile(f))}
          onRemove={() => setFile(undefined)}
        />
        <Field label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: חשבונית פינוי פסולת" />
        <Field label="סכום" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="₪" />
        <Field label="תאריך" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <BottomActions>
        <Button
          block
          disabled={!stage || !title || !amount}
          onClick={() => {
            addReceipt({ stageId: stage!, title, amount: +amount, date, preview: file?.preview });
            toast('ההוצאה נוספה');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
