import { Bell, ChevronDown, ChevronLeft, CreditCard, FileQuestion, FileText, ImagePlus, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, Checkbox, Chip, ConfirmDialog, Field, Modal } from '@/components/ui';
import { pickImages } from '@/lib/files';
import { faq } from '@/data/mock';
import { roleTitle, useStore } from '@/data/store';
import { cn, fmtDate } from '@/lib/format';

/* ---------- מסך עזרה + פופאפ שאלות נפוצות ---------- */

const topicIcons = [Star, Bell, CreditCard, FileText];

export function Help() {
  const { s } = useStore();
  const [topic, setTopic] = useState<number>();
  const [openQ, setOpenQ] = useState(0);
  const t = topic !== undefined ? faq[topic] : undefined;
  return (
    <>
      <AppBar title="" />
      <main className="animate-fade-up space-y-6 px-6 pb-10 pt-8">
        <div>
          <h1 className="font-display text-h3 font-bold">שלום {s.user.firstName},</h1>
          <p className="font-display text-h1 font-bold">איך נוכל לעזור לך?</p>
        </div>
        <section>
          <h2 className="mb-3 text-body font-semibold">שאלות נפוצות</h2>
          <div className="grid grid-cols-2 gap-4">
            {faq.map((f, i) => {
              const Icon = topicIcons[i] ?? FileQuestion;
              return (
                <button
                  key={f.topic}
                  onClick={() => {
                    setTopic(i);
                    setOpenQ(0);
                  }}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-white text-center shadow-blue transition hover:shadow-sm4"
                >
                  <Icon size={30} strokeWidth={1.3} />
                  <span className="mt-2 text-body">{f.topic}</span>
                  <span className="text-caption text-muted">{f.items.length} שאלות</span>
                </button>
              );
            })}
          </div>
        </section>
        <a href="https://wa.me/972500000000" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg border-2 border-primary-200 bg-white p-4">
          <MessageCircle size={32} strokeWidth={1.4} />
          <span className="flex-1">
            <span className="block text-body">לא מצאת תשובה ?</span>
            <span className="block text-body font-semibold text-primary">שלח לנו הודעה ב-whatsapp</span>
          </span>
          <ChevronLeft size={20} />
        </a>
      </main>

      <Modal open={!!t} onClose={() => setTopic(undefined)} title={t?.topic}>
        <div className="space-y-2">
          {t?.items.map((it, i) => (
            <div key={it.q} className="rounded-lg bg-primary-50">
              <button onClick={() => setOpenQ(openQ === i ? -1 : i)} className="flex w-full items-center gap-3 p-3 text-right">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-caption font-medium">{i + 1}</span>
                <span className="flex-1 text-body font-medium">{it.q}</span>
                <ChevronDown size={18} className={cn('transition', openQ === i && 'rotate-180')} />
              </button>
              {openQ === i && <p className="px-3 pb-3 text-body text-muted">{it.a}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

/* ---------- מסך תנאי שימוש ---------- */

const terms = [
  {
    t: 'קבלת התנאים',
    b: 'השימוש באפליקציית DirectScope ("האפליקציה") מהווה הסכמה מלאה ומחייבת לתנאי שימוש אלו. אם אינך מסכים לתנאים, אנא הפסק את השימוש באפליקציה לאלתר. תנאים אלו מהווים הסכם משפטי מחייב בינך לבין חברת DirectScope בע"מ ("החברה"), הרשומה בישראל ופועלת בהתאם לדיני מדינת ישראל.',
  },
  {
    t: 'השירותים המוצעים',
    b: 'האפליקציה מספקת פלטפורמה לניהול פרויקטי בנייה ושיפוץ, הכוללת: ניהול שלבי הפרויקט ומעקב התקדמות בזמן אמת, בדיקת הצעות מחיר וניתוחן, תיעוד שוטף של שלבי הבנייה כולל תמונות ועדכונים, ניהול מסמכים, חוזים ותכניות אדריכליות ותקשורת מאובטחת בין לקוחות, קבלנים ובעלי מקצוע. DirectScope היא פלטפורמה טכנולוגית בלבד ואינה צד לעסקאות בין לקוחות לקבלנים. החברה אינה אחראית לאיכות העבודה, לעמידה בלוחות זמנים, או לכל מחלוקת בין הצדדים.',
  },
];

export function Terms() {
  const nav = useNavigate();
  const { s, acceptTerms } = useStore();
  const [ok, setOk] = useState(s.termsAccepted);
  return (
    <>
      <AppBar title="" />
      <main className="animate-fade-up flex flex-1 flex-col">
        <div className="space-y-5 px-6 pt-8">
          <div>
            <h1 className="font-display text-h1 font-bold">תנאי שימוש</h1>
            <p className="text-caption text-muted">עדכון אחרון: ינואר 2026</p>
          </div>
          {terms.map((x, i) => (
            <section key={x.t} className="card p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-50 text-caption">{i + 1}</span>
                {x.t}
              </h2>
              <p className="text-body">{x.b}</p>
            </section>
          ))}
          <Checkbox checked={ok} onChange={() => setOk(!ok)} label="קראתי את כל תנאי השימוש" />
        </div>
        <BottomActions>
          <Button
            block
            disabled={!ok}
            onClick={() => {
              acceptTerms();
              nav(-1);
            }}
          >
            אישור
          </Button>
        </BottomActions>
      </main>
    </>
  );
}

/* ---------- מסך אמצעי תשלום + פופאפ כרטיס חדש ---------- */

export function Payment() {
  const [card, setCard] = useState('1234');
  const [open, setOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const toast = useToast();
  const [num, setNum] = useState('');
  const [holder, setHolder] = useState('');
  const [cvv, setCvv] = useState('');
  const [exp, setExp] = useState('');
  const next = new Date(Date.now() + 23 * 86400000).toISOString().slice(0, 10);
  const valid = holder && num.replace(/\D/g, '').length >= 15 && cvv.length >= 3 && /^\d{2}\/\d{2}$/.test(exp);

  return (
    <>
      <AppBar title="" />
      <main className="animate-fade-up space-y-5 px-6 pb-10 pt-8">
        <div>
          <h1 className="font-display text-h1 font-bold">אמצעי תשלום</h1>
          <p className="text-body text-muted">ניהול כרטיסי האשראי שלך</p>
        </div>
        <div className="mx-auto w-[300px] rounded-[20px] border-2 border-primary bg-white p-2 shadow-blue">
          <div className="relative h-44 rounded-2xl border border-primary p-5" dir="ltr">
            <span className="block h-10 w-16 rounded-md bg-accent" />
            <p className="absolute bottom-8 inset-x-5 flex justify-between text-h3 text-ink">
              <span>XXXX</span>
              <span>XXXX</span>
              <span>XXXX</span>
              <span>{card}</span>
            </p>
          </div>
        </div>
        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Chip tone={cancelled ? 'red' : 'green'}>{cancelled ? 'המנוי בוטל' : 'מנוי חודשי'}</Chip>
            <span className="text-body text-muted">{cancelled ? 'לא יתחדש' : 'מתחדש אוטומטית'}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-body text-muted">חיוב קרוב</p>
              <p className="text-lg">{cancelled ? '—' : fmtDate(next)}</p>
            </div>
            <div className="text-left">
              <p className="text-body text-muted">סכום חודשי</p>
              <p className="text-lg font-semibold">₪ 64</p>
            </div>
          </div>
        </section>
        <Button block onClick={() => setOpen(true)}>
          שנה כרטיס אשראי
        </Button>
        <button onClick={() => (cancelled ? setCancelled(false) : setConfirmCancel(true))} className="mx-auto block text-body underline">
          {cancelled ? 'חידוש מנוי' : 'ביטול מנוי'}
        </button>
        <ConfirmDialog
          open={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          title="לבטל את המנוי?"
          text="הגישה לפרויקט תישאר פעילה עד סוף תקופת החיוב הנוכחית"
          approveLabel="ביטול מנוי"
          onApprove={() => {
            setCancelled(true);
            toast('המנוי בוטל', 'info');
          }}
        />
      </main>

      <Modal open={open} onClose={() => setOpen(false)} title="פרטי כרטיס חדש">
        <div className="space-y-4">
          <Field label="שם בעל הכרטיס" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="כפי שמופיע על הכרטיס" />
          <Field
            label="מספר כרטיס"
            dir="ltr"
            inputMode="numeric"
            value={num}
            onChange={(e) =>
              setNum(
                e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 16)
                  .replace(/(\d{4})(?=\d)/g, '$1-'),
              )
            }
            placeholder="0000-0000-0000-0000"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="CVV" dir="ltr" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="000" />
            <Field
              label="תוקף"
              dir="ltr"
              inputMode="numeric"
              value={exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              placeholder="MM/YY"
            />
          </div>
          <p className="flex items-center gap-1 text-caption text-muted">
            <ShieldCheck size={14} /> הפרטים מוצפנים ומאובטחים
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={!valid}
              onClick={() => {
                setCard(num.replace(/\D/g, '').slice(-4));
                toast('הכרטיס עודכן');
                setOpen(false);
                setNum('');
                setCvv('');
              }}
            >
              שמור כרטיס
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              ביטול
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ---------- פרופיל (not designed yet – minimal) ---------- */

export function ProfileScreen() {
  const { s, setUser } = useStore();
  const [first, setFirst] = useState(s.user.firstName);
  const [last, setLast] = useState(s.user.lastName);
  const [avatar, setAvatar] = useState(s.user.avatar);
  const nav = useNavigate();
  const toast = useToast();
  return (
    <SubScreen title="פרטים אישיים">
      <div className="flex flex-col items-center gap-2 py-6">
        <button onClick={() => pickImages().then(([i]) => i && setAvatar(i))} className="relative" aria-label="החלפת תמונת פרופיל">
          <Avatar src={avatar} name={s.user.firstName} size={80} />
          <span className="absolute -bottom-1 -left-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-sm4">
            <ImagePlus size={16} />
          </span>
        </button>
        <p className="text-lg font-medium">
          {s.user.firstName} {s.user.lastName}
        </p>
        <p className="text-caption text-muted">
          {roleTitle(s.user.role)} · <span dir="ltr">+972 {s.user.phone}</span>
        </p>
      </div>
      <Heading title="עריכת פרטים אישיים" />
      <div className="space-y-4 px-6">
        <Field label="שם פרטי" value={first} onChange={(e) => setFirst(e.target.value)} />
        <Field label="שם משפחה" value={last} onChange={(e) => setLast(e.target.value)} />
      </div>
      <BottomActions>
        <Button
          block
          onClick={() => {
            setUser({ firstName: first, lastName: last, avatar });
            toast('הפרטים נשמרו');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
