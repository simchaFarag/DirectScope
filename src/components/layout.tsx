import { Bell, ChevronRight, Clock, CreditCard, FileText, Headphones, Home, LogOut, Menu, UserCircle2, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '@/data/store';
import { cn } from '@/lib/format';
import { LayoutGrid, MoneyBag, StageGlyph } from './icons';
import type { StageIcon } from '@/data/types';

/* ---------- Main app layout: app bar + content + bottom nav ---------- */

export function AppLayout() {
  return (
    <div className="phone">
      <Outlet />
    </div>
  );
}

export function TabScreen({ children, title, home }: { children: ReactNode; title?: string; home?: boolean }) {
  return (
    <>
      <AppBar title={title} home={home} />
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}

export function AppBar({ title, home }: { title?: string; home?: boolean }) {
  const [open, setOpen] = useState(false);
  const { s } = useStore();
  const nav = useNavigate();
  const pending = s.updates.filter((u) => u.status === 'pending').length;
  return (
    <>
      <header className={cn('sticky top-0 z-30 flex h-[88px] items-end px-6 pb-4', home ? 'bg-bg' : 'bg-white shadow-sm4')}>
        <button onClick={() => setOpen(true)} aria-label="תפריט" className="text-ink">
          <Menu size={24} strokeWidth={1.6} />
        </button>
        <span className="mr-4 text-body text-ink">{home ? '' : (title ?? s.project.name)}</span>
        {home && (
          <div className="mr-auto flex items-center gap-4">
            <button onClick={() => nav('/app/updates')} aria-label="התראות" className="relative">
              <Bell size={24} strokeWidth={1.6} />
              {pending > 0 && <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-bg" />}
            </button>
            <button onClick={() => nav('/app/profile')} aria-label="פרופיל">
              <UserCircle2 size={26} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </header>
      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const tabs = [
  { to: '/app/home', label: 'בית', icon: Home },
  { to: '/app/budget', label: 'תקציב', icon: MoneyBag },
  { to: '/app/schedule', label: 'זמנים', icon: Clock },
  { to: '/app/archive', label: 'ארכיון', icon: LayoutGrid },
];

export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-phone justify-center px-12">
      <div className="glass pointer-events-auto flex h-[72px] w-full items-center justify-around rounded-full shadow-bar">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('flex w-16 flex-col items-center gap-1 text-caption', isActive ? 'font-medium text-primary' : 'text-ink')}
          >
            <Icon size={24} strokeWidth={1.6} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* ---------- Hamburger drawer ---------- */

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { s, setUser, reset } = useStore();
  const go = (to: string) => {
    onClose();
    nav(to);
  };
  const groups = [
    [
      { label: 'פרטים אישיים', icon: UserCircle2, to: '/app/profile' },
      { label: 'עידכון אמצעי תשלום', icon: CreditCard, to: '/app/payment' },
      { label: 'שיתוף אנשי קשר והרשאות', icon: Users, to: '/app/share' },
    ],
    [
      { label: 'עזרה טכנית', icon: Headphones, to: '/app/help' },
      { label: 'תנאי שימוש', icon: FileText, to: '/app/terms' },
    ],
  ];
  return (
    <div className={cn('fixed inset-y-0 left-1/2 z-50 w-full max-w-phone -translate-x-1/2 overflow-hidden', open ? 'visible' : 'invisible')}>
      <div className={cn('absolute inset-0 bg-ink/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-[232px] flex-col bg-bg px-6 pb-8 pt-16 shadow-bar transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <button onClick={onClose} className="absolute left-4 top-6 text-muted" aria-label="סגור">
          <X size={22} />
        </button>
        {groups.map((items, gi) => (
          <ul key={gi} className={cn('space-y-6', gi > 0 && 'mt-6 border-t border-primary-100 pt-6')}>
            {items.map(({ label, icon: Icon, to }) => (
              <li key={to}>
                <button onClick={() => go(to)} className="flex items-center gap-3 text-body text-ink">
                  <Icon size={20} strokeWidth={1.6} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ))}

        <div className="mt-14 flex flex-col items-center gap-2 text-ink">
          <img src="/logo-mark.svg" alt="" className="h-14 w-14" />
          <span className="text-h2" dir="ltr">
            Directscope
          </span>
        </div>

        {/* Demo helper: switch the viewer role to preview the contractor experience */}
        <div className="mt-auto rounded-lg bg-primary-50 p-3">
          <p className="mb-2 text-caption text-muted">מצב תצוגה (הדגמה)</p>
          <div className="flex gap-2">
            {(['client', 'contractor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUser({ role: r })}
                className={cn('h-8 flex-1 rounded-full text-caption', s.user.role === r ? 'bg-primary text-white' : 'bg-white text-ink')}
              >
                {r === 'client' ? 'לקוח' : 'קבלן'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            reset();
            go('/');
          }}
          className="mt-4 flex items-center gap-2 text-caption text-muted"
        >
          <LogOut size={16} /> התחלה מחדש (איפוס דמו)
        </button>
      </aside>
    </div>
  );
}

/* ---------- Stage tabs (schedule / budget) ---------- */

export function StageTabs({ items, active, onSelect }: { items: { id: string; label: string; icon: StageIcon }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto bg-bg px-2 py-3">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn('flex min-w-[64px] flex-col items-center gap-1 px-2 pb-1 text-caption', active === t.id ? 'font-medium text-primary' : 'text-ink')}
        >
          <StageGlyph icon={t.icon} size={24} strokeWidth={1.4} />
          {t.label}
          <span className={cn('h-0.5 w-6 rounded-full', active === t.id ? 'bg-accent' : 'bg-transparent')} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Secondary page header (back arrow + title) ---------- */

export function PageHeader({ title, onBack, step }: { title: string; onBack?: () => void; step?: { n: number; of: number } }) {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-20 bg-bg px-6 pb-2 pt-12">
      <div className="relative flex h-8 items-center justify-center">
        <button onClick={onBack ?? (() => nav(-1))} className="absolute right-0 text-ink" aria-label="חזרה">
          <ChevronRight size={24} strokeWidth={1.6} />
        </button>
        <span className="text-body text-muted">{title}</span>
      </div>
      {step && (
        <div className="mt-6">
          <p className="mb-2 text-caption text-ink">
            שלב {step.n} מתוך {step.of}
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: step.of }).map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < step.n ? 'bg-accent' : 'bg-line')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generic sub-screen (no bottom nav).
 * - default: back header + body (onboarding / full pages)
 * - sheet: white bottom sheet with rounded top, as the Figma forms (עדכון חדש, הוספה ושיתוף, אישור חריגה...)
 */
export function SubScreen({ title, children, step, onBack, sheet }: { title: string; children: ReactNode; step?: { n: number; of: number }; onBack?: () => void; sheet?: boolean }) {
  const nav = useNavigate();
  if (sheet)
    return (
      <div className="flex flex-1 flex-col bg-bg">
        <div className="flex h-[120px] shrink-0 items-start px-6 pt-12">
          <button onClick={onBack ?? (() => nav(-1))} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm4" aria-label={`סגירת ${title}`}>
            <X size={18} />
          </button>
        </div>
        <div className="sheet-in flex flex-1 flex-col rounded-t-3xl bg-white pt-6 shadow-bar">{children}</div>
      </div>
    );
  return (
    <>
      <PageHeader title={title} step={step} onBack={onBack} />
      <div className="animate-fade-up flex flex-1 flex-col">{children}</div>
    </>
  );
}

export function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-6 py-6 text-center">
      <h1 className="font-display text-h2 font-bold">{title}</h1>
      {sub && <p className="mt-2 text-body text-ink">{sub}</p>}
    </div>
  );
}
