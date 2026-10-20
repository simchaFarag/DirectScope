import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppBar, Heading, StageTabs, SubScreen, TabScreen } from '@/components/layout';
import { StageGlyph } from '@/components/icons';
import { Icon } from '@/components/FigmaIcon';
import { Avatar, BottomActions, Button, Checkbox, ConfirmDialog, Field, Lightbox, Modal, PhotoPicker, ProgressBar, Select, TextArea, UploadSlot } from '@/components/ui';
import { useToast } from '@/components/toast';
import { pickDocument, pickImages } from '@/lib/files';
import { stageExceptions, useStore, useTotals } from '@/data/store';
import type { ExceptionReq } from '@/data/types';
import { cn, fmtDate, ils, stageLabel } from '@/lib/format';
import { ExtrasTab, Hero, SectionHead, SmallIconButton, stageTabs } from './Schedule';
import { useStageOptions } from './Updates';

/**
 * Figma "Progress_Bar" (192×304): a thick white half ring opening to the left with the paid part in yellow from its top end.
 * Geometry taken from the exported asset: centre (53,162), radius 136.8, 30.4 wide, spanning ±101.6°.
 */
function BudgetArc({ value }: { value: number }) {
  const cx = 53.02;
  const cy = 162;
  const r = 136.8;
  const a0 = (-101.6 * Math.PI) / 180;
  const span = (203.2 * Math.PI) / 180;
  const pt = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  const arc = (from: number, to: number) => `M${pt(from)} A${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${pt(to)}`;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="pointer-events-none absolute left-0 top-1/2 h-[304px] w-[192px] -translate-y-1/2">
      <svg viewBox="0 0 215.021 324" className="absolute left-[-5.45%] top-[-3.29%] h-[106.58%] w-[111.99%] overflow-visible" fill="none">
        <defs>
          <filter id="arcTrack" x="0" y="0" width="215.021" height="324" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3EA5F4" floodOpacity="0.1" />
          </filter>
          <filter id="arcFill" filterUnits="userSpaceOnUse" x="0" y="0" width="215.021" height="324">
            <feOffset in="SourceAlpha" dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix values="0 0 0 0 0.384 0 0 0 0 0.29 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend in2="SourceGraphic" />
          </filter>
        </defs>
        <path d={arc(a0, a0 + span)} stroke="white" strokeWidth={30.4} strokeLinecap="round" filter="url(#arcTrack)" />
        {v > 0 && <path d={arc(a0, a0 + span * v)} stroke="#FFC72C" strokeWidth={30.4} strokeLinecap="round" filter="url(#arcFill)" />}
      </svg>
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
    <TabScreen white>
      <Hero variant="clouds">
        {/* Figma: 403px block (416px row, centred) – totals on the right, the half ring with the paid sum on the left */}
        <div className="h-[403px] px-6">
          <div className="relative -mt-[6.5px] flex h-[416px] items-center justify-between lg:mx-auto lg:max-w-2xl lg:justify-between">
            <BudgetArc value={t.paid / ((contractor ? contract : t.total) || 1)} />
            <div className="relative flex flex-col items-start gap-8">
              <div className="font-display text-h3 font-bold">
                <p>{contractor ? 'סכום חוזה קבלן' : 'תקציב מעודכן'}</p>
                <p>{ils(contractor ? contract : t.total)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-body text-muted">נותר לתשלום</p>
                <p className="text-lg font-semibold leading-5">{ils((contractor ? contract : t.total) - t.paid)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-body text-muted">חריגות אושרו</p>
                <p className="text-lg font-semibold leading-5">{ils(t.approvedEx)}</p>
                <button onClick={() => nav('/app/exceptions')} className="flex items-start text-body leading-4 tracking-[0.042px] underline">
                  הצג אישורי חריגות ותוספות
                  {s.exceptions.some((e) => e.status === 'pending') && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
                </button>
              </div>
            </div>
            <div className="relative flex flex-col items-center gap-1.5 text-center">
              <div className="font-display font-bold">
                <p className="text-xl1">{Math.round(t.paid / 1000)}</p>
                <p className="text-h3">אלף ש״ח</p>
              </div>
              <p className="text-lg">שולמו עד כה</p>
            </div>
          </div>
        </div>
      </Hero>

      <div className="animate-fade-up relative -mt-6 flex flex-col items-center gap-6 px-6">
        {!contractor && (
          <Button variant="outline" onClick={() => nav('/app/expense/new')}>
            הוספת הוצאה
          </Button>
        )}
        <div className="w-full space-y-6 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {s.stages.map((st) => {
          const total = (contractor ? st.contractAmount : st.budget) + stageExceptions(s, st.id);
          return (
            /* Figma "budget level card" */
            <button key={st.id} onClick={() => nav(`/app/budget/${st.id}`)} className="flex w-full flex-col items-center gap-4 rounded-lg bg-bg p-4 text-right">
              <div className="flex w-full items-center gap-4">
                <StageGlyph icon={st.icon} />
                <div className="flex-1">
                  <p className="text-lg">{stageLabel(st.order)}</p>
                  <p className="font-display text-h3 font-bold">{st.name}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]">
                  <Icon name="gettin" className="text-primary" />
                </span>
              </div>
              <div className="flex w-full gap-6 whitespace-nowrap text-center text-body">
                <div className="flex flex-col gap-2">
                  <p className="text-muted">שולמו</p>
                  <p>{ils(st.paid)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-muted">יתרה</p>
                  <p>{ils(total - st.paid)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-muted">סה״כ</p>
                  <p>{ils(total)}</p>
                </div>
              </div>
            </button>
          );
        })}
        </div>
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
    <TabScreen white>
      <StageTabs items={stageTabs(s)} active={st.id} onSelect={(id) => nav(id === 'general' ? '/app/budget' : `/app/budget/${id}`)} />
      <div key={st.id} className="animate-fade-up space-y-10 px-6 pt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:space-y-0">
        <section className="flex flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-lg">סטטוס תקציב:</p>
              <p className="font-display text-h1 font-bold tracking-[-0.28px] text-primary">{ils(st.paid)}</p>
              <p className="text-body text-muted">שולמו עד כה</p>
            </div>
            <div className="flex w-full flex-col items-start">
              <span className="flex h-4 items-center rounded-lg bg-accent px-2 text-caption text-white">{Math.round((total - st.paid) / 1000)} אש״ח</span>
              <ProgressBar value={total ? (st.paid / total) * 100 : 0} color="bg-primary" className="bg-bg" />
            </div>
            <dl className="w-[278px] text-body">
              <Line k="סה״כ מעודכן:" v={ils(total)} />
              <Line k="יתרה לתשלום:" v={ils(total - st.paid)} />
              <Line k="סך חריגות (אושרו):" v={ils(ex)} />
              <Line k="סכום חוזה קבלן:" v={ils(st.contractAmount)} last />
            </dl>
          </div>
          {!contractor && (
            <Button variant="outline" onClick={() => nav(`/app/stage/${st.id}/edit`)}>
              עריכת שלב
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <SectionHead title="רשימת קניות">
            <SmallIconButton onClick={() => setAdding(true)} aria-label="הוספת פריט">
              <Icon name="addThin" />
            </SmallIconButton>
          </SectionHead>
          <div className="space-y-4">
            {shopping.map((it) => (
              <div key={it.id} className={cn('flex items-center rounded-lg px-4 py-2', it.done ? 'gap-4 bg-line' : 'gap-2 bg-bg')}>
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
                <span className="flex items-start gap-2">
                  <button className="grid h-6 w-6 place-items-center" onClick={() => pickImages({ capture: true }).then(([p]) => p && updateShopping(it.id, { photo: p }))} aria-label="צילום פריט">
                    <Icon name="camera" size={16} />
                  </button>
                  <button className="grid h-6 w-6 place-items-center" onClick={() => setEditing(it.id)} aria-label="עריכת פריט">
                    <Icon name="sEdit" />
                  </button>
                  <button className="grid h-6 w-6 place-items-center" onClick={() => removeShopping(it.id)} aria-label="מחיקה">
                    <Icon name="delete" size={16} />
                  </button>
                </span>
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

        <section className="flex flex-col gap-2">
          <SectionHead title="חריגות לאישור" />
          {exceptions.length ? (
            <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {exceptions.map((e) => (
                <div key={e.id} className="w-[312px] shrink-0 lg:w-full">
                  <ExceptionCard e={e} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-muted">אין חריגות שממתינות לאישור</p>
          )}
        </section>

        {!contractor && (
          <section className="flex flex-col gap-4">
            <SectionHead title="פירוט הוצאות">
              <SmallIconButton onClick={() => nav(`/app/receipt/new?stage=${st.id}`)} aria-label="הוספת אסמכתא">
                <Icon name="addThin" />
              </SmallIconButton>
            </SectionHead>
            <div className="space-y-2">
              {receipts.map((r) => (
                /* Figma "פירוט הוצאות - כרטיס" */
                <button key={r.id} onClick={() => nav(`/app/receipts/${r.id}`)} className="flex w-full items-center gap-2 overflow-hidden rounded-lg bg-bg p-4 text-right">
                  <img src={r.preview ?? '/img/doc.png'} alt="" className="h-8 w-8 shrink-0 rounded-[5.333px] object-cover" />
                  <div className="flex flex-col gap-1.5 whitespace-nowrap text-body">
                    <p className="max-w-[180px] truncate">{r.title}</p>
                    <p className="text-btn font-medium tracking-[0.042px]">{ils(r.amount)}</p>
                  </div>
                  <div className="flex flex-1 self-stretch">
                    <span className="mr-auto flex h-4 items-center rounded-lg bg-primary-100 px-2 text-caption">{fmtDate(r.date, true)}</span>
                  </div>
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

/** label on the right, amount on the left, 1.5px light-blue divider between rows (Figma "divider") */
function Line({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <>
      <div className="flex gap-2">
        <dt className="whitespace-nowrap">{k}</dt>
        <dd className="flex-1 text-left">{v}</dd>
      </div>
      {!last && <div className="flex h-2 items-start pt-[2.5px]"><span className="h-[1.5px] w-full rounded-full bg-primary-100" /></div>}
    </>
  );
}

/* ---------- Exception card + details popup ---------- */

/** `white`: on the exceptions screen (light page) a pending card is white; in the stage budget it is light blue-gray */
export function ExceptionCard({ e, white }: { e: ExceptionReq; white?: boolean }) {
  const { s, setExceptionStatus } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const stage = s.stages.find((x) => x.id === e.stageId);
  const client = s.user.role === 'client';
  return (
    <>
      {/* Figma "Exception card" (pending): yellow outline, avatar + byline + stage chip, title, amount, approve / view */}
      <article className={cn('flex flex-col gap-4 rounded-lg p-4', e.status === 'pending' ? cn('border border-accent', white ? 'bg-white' : 'bg-bg') : 'bg-[#F0F1F3] text-muted')}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Avatar src={e.avatar} name={e.author} size={24} />
            <div className="flex flex-1 flex-col items-start gap-2">
              <p className="text-btn font-medium tracking-[0.042px]">{e.author}</p>
              <p className="flex items-center gap-1 text-caption text-muted">
                {e.authorTitle} <span className="h-0.5 w-0.5 rounded-full bg-muted" /> {e.time}
              </p>
            </div>
            {stage && <span className="flex h-4 items-center self-start rounded-lg bg-primary-100 px-2 text-caption text-ink">{stage.name.split(' ')[0]}</span>}
          </div>
          <div>
            <p className="text-body">{e.title}</p>
            <p className="text-lg font-semibold leading-5">{ils(e.amount)}</p>
          </div>
        </div>
        {/* client + pending: approve / view; otherwise a status line on the left (Figma: "ממתין לאישור", "חריגה אושרה") */}
        <div className={cn('flex gap-6', e.status === 'pending' && client ? 'justify-center' : 'justify-end')}>
          {e.status === 'pending' ? (
            client ? (
              <Button size="sm" onClick={() => setConfirm(true)}>
                אישור
              </Button>
            ) : (
              <button onClick={() => setOpen(true)} className="text-btn font-medium tracking-[0.042px] text-ink">
                ממתין לאישור
              </button>
            )
          ) : (
            <button onClick={() => setOpen(true)} className={cn('text-btn font-medium tracking-[0.042px]', e.status === 'approved' ? 'text-ink' : 'text-danger')}>
              {e.status === 'approved' ? 'חריגה אושרה' : 'חריגה נדחתה'}
            </button>
          )}
          {e.status === 'pending' && client && (
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
      <AppBar menuOnly />
      {/* Figma: 16px gaps (client) / 24px with the send button (contractor) */}
      <main className={cn('animate-fade-up desk flex flex-col px-6 pb-10 pt-4', contractor ? 'gap-6' : 'gap-4')}>
        <div className={cn('flex items-center justify-between', contractor ? 'pb-2 pt-4' : 'py-4')}>
          <h1 className="font-display text-h1 font-bold tracking-[-0.28px]">אישורי חריגה</h1>
          {pending > 0 && (
            <span className="flex h-6 items-center rounded bg-warn px-2 text-caption font-medium text-[#FEFAF5]">
              {pending} {pending === 1 ? 'ממתין' : 'ממתינים'} {contractor ? 'לאישור' : 'לאישורך'}
            </span>
          )}
        </div>
        {contractor && (
          <div className="flex justify-center">
            <Button onClick={() => nav('/app/exceptions/new')}>שליחת אישור חדש</Button>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
          {[...s.exceptions]
            .sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending'))
            .map((e) => (
              <ExceptionCard key={e.id} e={e} white />
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
      <div className="space-y-6 px-6">
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
    <SubScreen title="פירוט הוצאות" sheet>
      <Heading title="פירוט הוצאות" sub="הוספת חשבונית/קבלה" />
      {/* Figma "הוספת אסמכתא הוצאה": big upload area, title, then date | amount side by side (placeholders only), small centred save */}
      <div className="space-y-4 px-6">
        {!q.get('stage') && <Select placeholder="בחר שלב בנייה" options={options} value={stage} onChange={setStage} />}
        <UploadSlot
          className="aspect-[342/324]"
          filled={file ? (file.preview ?? '/img/doc.png') : undefined}
          label={file?.name ?? 'העלאת קובץ / צילום'}
          onAdd={() => pickDocument().then((f) => f && setFile(f))}
          onRemove={() => setFile(undefined)}
        />
        <Field aria-label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" />
        <div className="flex gap-4">
          <Field aria-label="תאריך" className="flex-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Field aria-label="סכום" className="flex-1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="סכום" />
        </div>
      </div>
      <BottomActions inline>
        <Button
          className="mx-auto"
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
