import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomActions, Button, ClearField, Radio } from '@/components/ui';
import { Icon, type IconName } from '@/components/FigmaIcon';
import { Heading, SubScreen } from '@/components/layout';
import { useStore } from '@/data/store';
import type { Role } from '@/data/types';
import { pickImages } from '@/lib/files';
import { cn } from '@/lib/format';

export function Logo({ size = 78 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <img src="/logo-mark.svg" alt="" style={{ width: size, height: size }} />
      <span className="text-[36px] leading-[44px] text-ink" dir="ltr">
        Directscope
      </span>
    </div>
  );
}

/** Splash → Welcome (Figma: welcome ×2) */
export function Splash() {
  const nav = useNavigate();
  const { s } = useStore();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <Logo />
      <div className={cn('transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0')}>
        <Button onClick={() => nav(s.onboarded ? '/app/home' : '/login/phone')}>מתחילים</Button>
      </div>
    </div>
  );
}

/** login-step 1 */
export function PhoneLogin() {
  const nav = useNavigate();
  const { s, setUser } = useStore();
  const [phone, setPhone] = useState(s.user.phone);
  const valid = /^0?5\d{8}$/.test(phone.replace(/\D/g, ''));
  return (
    <SubScreen title="הרשמה / כניסה לחשבון" onBack={() => nav('/')}>
      <Heading title="מה מספר הטלפון שלך?" sub="יישלח אליך קוד אימות לאישור המספר" />
      {/* Figma: 48px number field (+972, number, clear) with the Israeli flag pill on its left; the note 24px below */}
      <div className="flex flex-col gap-6 px-6">
        <div className="flex items-center gap-2">
          <ClearField value={phone} onChange={(v) => setPhone(v.replace(/[^\d]/g, '').slice(0, 10))} placeholder="527683159" tel autoFocus className="h-12 flex-1" />
          <span className="flex h-10 shrink-0 items-center rounded-full border border-primary-100 px-2" aria-label="ישראל +972">
            <Icon name="down" />
            <span className="grid w-10 place-items-center">
              <img src="/img/flag-il.svg" alt="" width={32} height={32} />
            </span>
          </span>
        </div>
        <p className="text-center text-body text-muted">
          נשתמש במספר רק כדי לאמת את זהותך
          <br />
          לשמור על חשבונך מאובטח
        </p>
      </div>
      <BottomActions>
        <Button
          className="mx-auto w-[314px] max-w-full"
          disabled={!valid}
          onClick={() => {
            setUser({ phone: phone.replace(/^0/, '') });
            nav('/login/otp');
          }}
        >
          אישור
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** login-step 2 */
export function Otp() {
  const nav = useNavigate();
  const { s } = useStore();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [sent, setSent] = useState(false);
  const full = code.every(Boolean);

  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length > 1) {
      // pasted full code
      const next = d.slice(0, 6).split('');
      setCode([...next, ...Array(6 - next.length).fill('')]);
      refs.current[Math.min(5, next.length)]?.focus();
      return;
    }
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <SubScreen title="אימות מספר טלפון">
      {/* Figma: no title – two body lines, six 40px boxes 16px apart, then "לא קיבלת את הקוד? שלח קוד שוב" */}
      <div className="flex flex-col gap-6 px-6 pt-12 short:pt-6">
        <div className="flex flex-col items-center gap-2 py-4 text-center text-body">
          <p>נא להזין את הקוד בן 6 הספרות שנשלח אל</p>
          <p dir="ltr">972+ {s.user.phone}</p>
        </div>
        <div className="flex h-14 items-center justify-center gap-4" dir="ltr">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={c}
              inputMode="numeric"
              autoFocus={i === 0}
              aria-label={`ספרה ${i + 1}`}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Backspace' && !c && i > 0 && refs.current[i - 1]?.focus()}
              className="h-10 w-10 rounded-lg border border-primary-200 bg-white text-center text-body focus:border-primary focus:outline-none"
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-body">
          <span className="text-muted">לא קיבלת את הקוד?</span>
          <button className="leading-4 tracking-[0.042px] underline" onClick={() => setSent(true)}>
            {sent ? 'נשלח שוב ✓' : 'שלח קוד שוב'}
          </button>
        </div>
      </div>
      <BottomActions>
        <Button className="mx-auto w-[314px] max-w-full" disabled={!full} onClick={() => nav('/login/verified')}>
          המשך
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

/** Transitional success / loading screens (Frame 1000005822 / 37 / 38) */
export function Interstitial({ text, next, bg, loading, delay = 1600 }: { text: string; next: string; bg: string; loading?: boolean; delay?: number }) {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav(next, { replace: true }), delay);
    return () => clearTimeout(t);
  }, [nav, next, delay]);
  // Figma: the previous screen dimmed (#A2A9B7 at 70%); success = white pill near the top, loading = small centred card
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-cover bg-top px-6" style={{ backgroundImage: `url(${bg})` }}>
      <div className="absolute inset-0 bg-[rgba(162,169,183,0.7)]" />
      {loading ? (
        <div className="animate-fade-up relative my-auto flex w-[242px] flex-col items-center overflow-hidden rounded-lg bg-white shadow-blue">
          <div className="flex w-full justify-start px-2 pt-2">
            <button onClick={() => nav(-1)} className="grid h-6 w-6 place-items-center rounded-full bg-primary-50 text-ink" aria-label="ביטול">
              <X size={12} strokeWidth={1.4} />
            </button>
          </div>
          <img src="/img/checking.gif" alt="" width={150} height={150} />
          <p className="pb-4 pt-2 text-center text-lg leading-6">{text}</p>
        </div>
      ) : (
        <div className="animate-fade-up relative mt-[101px] flex w-full max-w-[342px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-yellow">
          <p className="text-lg leading-6">{text}</p>
          <span className="grid h-6 w-6 place-items-center">
            <Icon name="check" />
          </span>
        </div>
      )}
    </div>
  );
}

const roles: { value: Role; label: string; icon: IconName }[] = [
  { value: 'renovator', label: 'משפץ', icon: 'roleClient' },
  { value: 'contractor', label: 'קבלן', icon: 'roleContractor' },
  { value: 'architect', label: 'אדריכל', icon: 'roleArchitect' },
];

/** login-step 3 – create profile */
export function Profile() {
  const nav = useNavigate();
  const { s, setUser } = useStore();
  const [role, setRole] = useState<Role>(s.user.role === 'client' ? 'renovator' : s.user.role);
  const [first, setFirst] = useState(s.user.firstName);
  const [last, setLast] = useState(s.user.lastName);
  const [gender, setGender] = useState(s.user.gender);
  const [avatar, setAvatar] = useState<string | undefined>(s.user.avatar);

  return (
    <SubScreen title="יצירת פרופיל">
      <Heading title="פרטים אישיים" sub="נעים להכיר :)" />
      {/* Figma: roles, photo link, first / last name, gender box and the note – 24px apart */}
      <div className="flex flex-col items-center gap-6 px-6 short:gap-4">
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-body">בחר\י את התפקיד המתאים לך:</p>
          <div className="flex justify-center gap-6">
            {roles.map((r) => (
              <button key={r.value} onClick={() => setRole(r.value)} className="flex flex-col items-center">
                <span className={cn('grid h-14 w-14 place-items-center rounded-full shadow-[0_0_5px_rgba(62,165,244,0.1)] transition', role === r.value ? 'bg-primary-200' : 'bg-white')}>
                  <Icon name={r.icon} />
                </span>
                <span className={cn('text-caption', role === r.value && 'font-medium text-primary')}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => pickImages().then(([i]) => i && setAvatar(i))} className="flex items-center gap-2 text-body leading-4 tracking-[0.042px] underline">
          <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-50 text-primary">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <Icon name="jpeg" />}</span>
          {avatar ? 'החלפת תמונה' : 'הוסף תמונת פרופיל (לא חובה)'}
        </button>
        <ClearField value={first} onChange={setFirst} placeholder="שם פרטי" className="w-full" />
        <ClearField value={last} onChange={setLast} placeholder="שם משפחה" className="w-full" />
        <div className="flex w-full flex-col gap-2.5 rounded-lg border border-primary-100 px-4 py-2">
          <p className="text-caption text-muted">מגדר</p>
          <div className="flex items-start gap-4">
            <Radio checked={gender === 'female'} onChange={() => setGender('female')} label="אישה" />
            <span className="h-8 w-px bg-primary-100" />
            <Radio checked={gender === 'male'} onChange={() => setGender('male')} label="גבר" />
          </div>
        </div>
        <p className="text-center text-body text-muted">המידע האישי שלך ישמר בצורה מאובטחת</p>
      </div>
      <BottomActions>
        <Button
          className="mx-auto w-[314px] max-w-full"
          disabled={!first || !last}
          onClick={() => {
            // A renovator/home owner is the project's client; contractor/architect join as professionals
            setUser({ firstName: first, lastName: last, gender, role: role === 'renovator' ? 'client' : role, avatar });
            nav('/setup/details');
          }}
        >
          התחל
        </Button>
      </BottomActions>
    </SubScreen>
  );
}
