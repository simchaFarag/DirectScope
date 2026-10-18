import { CheckCircle2, ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomActions, Button, Radio } from '@/components/ui';
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
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
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
      <div className="px-6">
        <div className="flex items-center gap-2 rounded-lg border border-primary-100 bg-white px-4 py-3 focus-within:border-primary" dir="ltr">
          <span className="text-body text-muted">+972</span>
          <span className="h-5 w-px bg-line" />
          <input
            inputMode="numeric"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
            className="flex-1 bg-transparent text-body focus:outline-none"
            placeholder="527683159"
          />
        </div>
        <p className="mt-4 text-center text-caption text-muted">נשתמש במספר רק כדי לאמת את זהותך ולשמור על חשבונך מאובטח</p>
      </div>
      <BottomActions>
        <Button
          block
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
    <SubScreen title="הרשמה / כניסה לחשבון">
      <Heading title="אימות מספר טלפון" sub="נא להזין את הקוד בן 6 הספרות שנשלח אל" />
      <p className="-mt-4 text-center text-body font-medium" dir="ltr">
        +972 {s.user.phone}
      </p>
      <div className="mt-8 flex justify-center gap-2 px-6" dir="ltr">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={c}
            inputMode="numeric"
            autoFocus={i === 0}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => e.key === 'Backspace' && !c && i > 0 && refs.current[i - 1]?.focus()}
            className="h-14 w-12 rounded-lg border border-primary-100 bg-white text-center text-h2 focus:border-primary focus:outline-none"
          />
        ))}
      </div>
      <div className="mt-6 text-center text-caption text-muted">
        לא קיבלת את הקוד?{' '}
        <button className="text-ink underline" onClick={() => setSent(true)}>
          {sent ? 'נשלח שוב ✓' : 'שלח קוד שוב'}
        </button>
      </div>
      <p className="mt-2 text-center text-caption text-muted">(בהדגמה – כל קוד בן 6 ספרות עובר)</p>
      <BottomActions>
        <Button block disabled={!full} onClick={() => nav('/login/verified')}>
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
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${bg})` }}>
      {loading ? (
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-100 border-t-primary" />
      ) : (
        <CheckCircle2 size={64} className="text-primary" strokeWidth={1.4} />
      )}
      <p className="font-display text-h2 font-bold">{text}</p>
    </div>
  );
}

const roles: { value: Role; label: string; tone: string }[] = [
  { value: 'renovator', label: 'משפץ', tone: 'text-primary' },
  { value: 'contractor', label: 'קבלן', tone: 'text-accent-dark' },
  { value: 'architect', label: 'אדריכל', tone: 'text-accent' },
];

function RoleBadge({ active, label, tone, onClick }: { active: boolean; label: string; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span className={cn('grid h-16 w-16 place-items-center rounded-full bg-white shadow-blue ring-2 transition', active ? 'ring-primary' : 'ring-transparent')}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={tone}>
          <path d="M5 11a7 7 0 0 1 14 0" />
          <path d="M4 11h16v1.5H4zM12 4v3" />
          <circle cx="12" cy="15" r="3" />
          <path d="M6 22c0-3 2.7-5 6-5s6 2 6 5" />
        </svg>
      </span>
      <span className={cn('text-caption', active ? 'font-medium text-primary' : 'text-ink')}>{label}</span>
    </button>
  );
}

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
      <div className="space-y-4 px-6">
        <p className="text-center text-body">בחר\י את התפקיד המתאים לך:</p>
        <div className="flex justify-center gap-6">
          {roles.map((r) => (
            <RoleBadge key={r.value} active={role === r.value} label={r.label} tone={r.tone} onClick={() => setRole(r.value)} />
          ))}
        </div>
        <button onClick={() => pickImages().then(([i]) => i && setAvatar(i))} className="mx-auto flex items-center gap-2 text-body underline">
          {avatar ? <img src={avatar} alt='' className='h-7 w-7 rounded-full object-cover' /> : <ImagePlus size={18} />} {avatar ? 'החלפת תמונה' : 'הוסף תמונת פרופיל (לא חובה)'}
        </button>
        <ClearField value={first} onChange={setFirst} placeholder="שם פרטי" />
        <ClearField value={last} onChange={setLast} placeholder="שם משפחה" />
        <div className="rounded-lg border border-primary-100 bg-white px-4 py-3">
          <p className="mb-2 text-caption text-muted">מגדר</p>
          <div className="flex items-center gap-6">
            <Radio checked={gender === 'male'} onChange={() => setGender('male')} label="גבר" />
            <span className="h-6 w-px bg-line" />
            <Radio checked={gender === 'female'} onChange={() => setGender('female')} label="אישה" />
          </div>
        </div>
        <p className="text-center text-caption text-muted">המידע האישי שלך ישמר בצורה מאובטחת</p>
      </div>
      <BottomActions>
        <Button
          block
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

export function ClearField({ value, onChange, placeholder, suffix }: { value: string; onChange: (v: string) => void; placeholder: string; suffix?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary-100 bg-white px-4 py-3 focus-within:border-primary">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent text-body placeholder:text-muted focus:outline-none" />
      {suffix}
      {value && (
        <button onClick={() => onChange('')} className="text-muted" aria-label="נקה">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
