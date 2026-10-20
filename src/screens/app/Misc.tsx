import { ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, Checkbox, ConfirmDialog, Field, Modal } from '@/components/ui';
import { Icon } from '@/components/FigmaIcon';
import { pickImages } from '@/lib/files';
import { faq } from '@/data/mock';
import { roleTitle, useStore } from '@/data/store';
import { cn, fmtDate } from '@/lib/format';

/* ---------- מסך עזרה + פופאפ שאלות נפוצות ---------- */

/** Figma grid order (RTL): הקמת פרויקט · עדכונים ואישורים / מסמכים וקבצים · תשלומים, each with its 40px icon */
const topicIcons: Record<string, string> = {
  'הקמת פרויקט': '/img/help-setup.svg',
  'עדכונים ואישורים': '/img/help-updates.svg',
  'מסמכים וקבצים': '/img/help-docs.svg',
  תשלומים: '/img/help-payments.svg',
};
const topicOrder = Object.keys(topicIcons);

export function Help() {
  const { s } = useStore();
  const [topic, setTopic] = useState<number>();
  const t = topic !== undefined ? faq[topic] : undefined;
  const ordered = [...faq.keys()].sort((a, b) => topicOrder.indexOf(faq[a].topic) - topicOrder.indexOf(faq[b].topic));
  return (
    <>
      <AppBar menuOnly />
      {/* Figma "מסך עזרה": greeting, the 160px topic tiles (16px apart) and the WhatsApp card, 24px apart */}
      <main className="animate-fade-up desk-narrow flex flex-col gap-6 px-6 pb-10 pt-4">
        <div className="py-4 font-display font-bold">
          <h1 className="text-h2 tracking-[-0.2px]">שלום {s.user.firstName},</h1>
          <p className="text-h1 tracking-[-0.28px]">איך נוכל לעזור לך?</p>
        </div>
        <section className="flex flex-col gap-2">
          <h2 className="px-2 text-lg font-semibold leading-5">שאלות נפוצות</h2>
          <div className="grid grid-cols-[repeat(2,160px)] justify-center gap-4 lg:grid-cols-[repeat(4,160px)]">
            {ordered.map((i) => (
              <button key={faq[i].topic} onClick={() => setTopic(i)} className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg bg-white px-2 py-4 text-center transition hover:shadow-blue">
                <img src={topicIcons[faq[i].topic] ?? '/img/help-docs.svg'} alt="" width={40} height={40} />
                <span className="flex flex-col">
                  <span className="text-lg leading-6">{faq[i].topic}</span>
                  <span className="text-body text-muted">{faq[i].items.length} שאלות</span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <a href="https://wa.me/972500000000" target="_blank" rel="noopener" className="flex items-center gap-4 rounded-lg border-2 border-primary-200 bg-white p-4">
          <img src="/img/help-whatsapp.svg" alt="" width={40} height={40} />
          <span className="flex flex-1 flex-col items-start text-lg">
            <span className="leading-6">לא מצאת תשובה ?</span>
            <span className="font-semibold leading-5 text-primary">שלח לנו הודעה ב-whatsapp</span>
          </span>
          <Icon name="left" />
        </a>
      </main>

      {/* Figma "פופאפ שאלות נפוצות": centred title, every answer open, number in a light-blue circle, close button on the left */}
      <Modal open={!!t} onClose={() => setTopic(undefined)} closeLeft>
        <h3 className="mb-6 text-center font-display text-h3 font-bold">
          <span>{t?.topic}</span>
        </h3>
        <ol className="space-y-6">
          {t?.items.map((it, i) => (
            <li key={it.q} className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 text-lg font-semibold">{i + 1}</span>
                <span className="flex-1 text-lg font-semibold leading-5">{it.q}</span>
              </div>
              <p className="text-body">{it.a}</p>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}

/* ---------- מסך תנאי שימוש ---------- */

const terms = [
  {
    t: 'קבלת התנאים',
    b: 'השימוש באפליקציית DirectScope ("האפליקציה") מהווה הסכמה מלאה ומחייבת לתנאי שימוש אלו. אם אינך מסכים לתנאים, אנא הפסק את השימוש באפליקציה לאלתר.\nתנאים אלו מהווים הסכם משפטי מחייב בינך לבין חברת DirectScope בע"מ ("החברה"), הרשומה בישראל ופועלת בהתאם לדיני מדינת ישראל.',
  },
  {
    t: 'השירותים המוצעים',
    b: 'האפליקציה מספקת פלטפורמה לניהול פרויקטי בנייה ושיפוץ, הכוללת:\n\nניהול שלבי הפרויקט ומעקב התקדמות בזמן אמת\nבדיקת הצעות מחיר וניתוחן באמצעות בינה מלאכותית\nתיעוד שוטף של שלבי הבנייה, כולל תמונות ועדכונים\nניהול מסמכים, חוזים ותכניות אדריכליות\nתקשורת מאובטחת בין לקוחות, קבלנים ובעלי מקצוע\n\nDirectScope היא פלטפורמה טכנולוגית בלבד ואינה צד לעסקאות בין לקוחות לקבלנים. החברה אינה אחראית לאיכות העבודה, לעמידה בלוחות זמנים, או לכל מחלוקת בין הצדדים.',
  },
];

export function Terms() {
  const nav = useNavigate();
  const { s, acceptTerms } = useStore();
  const [ok, setOk] = useState(s.termsAccepted);
  return (
    <>
      <AppBar menuOnly />
      {/* Figma "מסך תנאי שימוש": H3 + date, one white card (numbered sections 32px apart), the checkbox row and a small centred button */}
      <main className="animate-fade-up desk-narrow flex flex-col gap-4 px-6 pb-6 pt-4">
        <div className="py-4">
          <h1 className="font-display text-h3 font-bold">תנאי שימוש</h1>
          <p className="text-caption">עדכון אחרון: ינואר 2026</p>
        </div>
        <div className="flex flex-col gap-8 rounded-2xl bg-white p-4">
          {terms.map((x, i) => (
            <section key={x.t} className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold leading-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-100 font-display text-h3 font-bold">{i + 1}</span>
                {x.t}
              </h2>
              <p className="whitespace-pre-line text-body">{x.b}</p>
            </section>
          ))}
        </div>
        <div className="rounded-lg bg-white px-4 py-2">
          <Checkbox checked={ok} onChange={() => setOk(!ok)} label="קראתי את כל תנאי השימוש" />
        </div>
        <div className="flex justify-center">
          <Button
            disabled={!ok}
            onClick={() => {
              acceptTerms();
              nav(-1);
            }}
          >
            אישור
          </Button>
        </div>
      </main>
    </>
  );
}

/* ---------- מסך אמצעי תשלום + פופאפ כרטיס חדש ---------- */

/** Figma "credit object" (304×208): blue outlined card with the yellow chip and the masked number, drawn from the exported vectors */
function CreditCardArt({ last4 }: { last4: string }) {
  return (
    <div className="relative h-[208px] w-[304px]" dir="ltr">
      <img src="/img/card-frame.svg" alt="" width={346} height={250} className="absolute left-[-6.91%] top-[-10.1%] max-w-none" />
      <img src="/img/card-inner.svg" alt="" width={288} height={192} className="absolute left-[2.63%] top-[3.85%] max-w-none" />
      <img src="/img/card-chip.svg" alt="" width={70} height={40} className="absolute left-[15.79%] top-[19.23%] max-w-none" />
      <p className="absolute left-[48.34px] top-[147.22px] flex gap-4 whitespace-nowrap text-lg leading-6">
        <span>XXXX</span>
        <span>XXXX</span>
        <span>XXXX</span>
        <span>{last4}</span>
      </p>
    </div>
  );
}

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
      <AppBar menuOnly />
      {/* Figma "מסך אמצעי תשלום": header, card art and the subscription card (40px apart), then the buttons 48px lower */}
      <main className="animate-fade-up flex flex-col gap-12 px-6 pb-10 pt-4 lg:mx-auto lg:w-full lg:max-w-lg">
        <div className="flex flex-col items-center gap-6">
          <div className="w-full py-4">
            <h1 className="font-display text-h3 font-bold">אמצעי תשלום</h1>
            <p className="text-body">ניהול כרטיסי האשראי שלך</p>
          </div>
          <div className="flex w-full flex-col items-center gap-10">
            <CreditCardArt last4={card} />
            <section className="flex w-full flex-col gap-2 rounded-lg bg-white p-4">
              <div className="flex items-start justify-between">
                <span className={cn('flex h-4 items-center rounded-lg px-2 text-caption', cancelled ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success-dark')}>{cancelled ? 'המנוי בוטל' : 'מנוי חודשי'}</span>
                <span className="text-body text-muted">{cancelled ? 'לא יתחדש' : 'מתחדש אוטומטית'}</span>
              </div>
              <div className="flex items-center justify-between text-center">
                <div className="flex flex-col items-center">
                  <p className="text-body text-muted">חיוב קרוב</p>
                  <p className="text-lg leading-6">{cancelled ? '—' : fmtDate(next).replace(/\.\d\d(\d\d)$/, '.$1')}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-body text-muted">סכום חודשי</p>
                  <p className="text-lg font-semibold leading-5">₪ 64</p>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <Button block onClick={() => setOpen(true)}>
            שנה כרטיס אשראי
          </Button>
          <button onClick={() => (cancelled ? setCancelled(false) : setConfirmCancel(true))} className="flex h-8 items-center px-4 text-body leading-4 tracking-[0.042px] text-muted underline">
            {cancelled ? 'חידוש מנוי' : 'ביטול מנוי'}
          </button>
        </div>
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

      {/* Figma "פופאפ כרטיס חדש" */}
      <Modal open={open} onClose={() => setOpen(false)} title="פרטי כרטיס חדש">
        <div className="flex flex-col gap-6">
          <Field label="שם בעל הכרטיס" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="כפי שמופיע על הכרטיס" />
          <Field
            label="מספר כרטיס"
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
          <div className="grid grid-cols-2 gap-6">
            <Field
              label="תוקף"
              inputMode="numeric"
              value={exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              placeholder="MM/YY"
            />
            <Field label="CVV" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="000" />
          </div>
          <p className="flex items-start gap-2 text-body text-muted">
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center">
              <img src="/img/lock.svg" alt="" width={13.75} height={19.25} />
            </span>
            הפרטים מוצפנים ומאובטחים
          </p>
          <div className="flex items-center gap-4">
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
            <Button variant="outline" className="shrink-0 px-8" onClick={() => setOpen(false)}>
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
