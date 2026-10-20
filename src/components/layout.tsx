import { ChevronRight, CreditCard, FileText, Headphones, LogOut, UserCircle2, Users, X } from 'lucide-react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/data/store';
import { cn } from '@/lib/format';
import { Icon, type IconName } from './FigmaIcon';
import { StageGlyph } from './icons';
import type { StageIcon } from '@/data/types';

/* ---------- Main app layout: app bar + content + bottom nav ---------- */

/** Mobile: phone-width column exactly as the Figma. Desktop (lg+): app screens stretch to the window, login/setup stay phone width. */
export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className={cn('phone', pathname.startsWith('/app') && 'lg:max-w-none')}>
      <Outlet />
    </div>
  );
}

/** `white`: screens whose Figma background is white (bg-inside) instead of the light-blue bg */
export function TabScreen({ children, title, home, white }: { children: ReactNode; title?: string; home?: boolean; white?: boolean }) {
  return (
    <>
      <AppBar title={title} home={home} />
      <main className={cn('desk flex-1 pb-28 lg:pb-12 lg:pt-6', white && 'max-lg:bg-white')}>{children}</main>
      <BottomNav />
    </>
  );
}

export function AppBar({ title, home, menuOnly }: { title?: string; home?: boolean; menuOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const { s } = useStore();
  const nav = useNavigate();
  const pending = s.updates.filter((u) => u.status === 'pending').length;
  return (
    <>
      {/* Figma "App Bar": Default (home) / inside (white + title) / only menu (light + shadow) */}
      {/* Desktop: one white bar – menu + logo + project, the four tabs in the middle, alerts + profile on the left */}
      <header className={cn('sticky top-0 z-30 flex h-[88px] items-end gap-4 px-[10px] text-ink lg:h-[72px] lg:items-center lg:bg-white lg:px-10 lg:pb-0 lg:shadow-sm4', home ? 'bg-bg' : menuOnly ? 'bg-bg shadow-sm4' : 'bg-white shadow-sm4')}>
        <button onClick={() => setOpen(true)} aria-label="תפריט" className="grid h-12 w-12 shrink-0 place-items-center">
          <Icon name="menu" />
        </button>
        <span className="hidden items-center gap-2 lg:flex" dir="ltr">
          <span className="text-h3">Directscope</span>
          <img src="/logo-mark.svg" alt="" className="h-8 w-8" />
        </span>
        {!home && !menuOnly && <span className="flex h-12 items-center text-body text-muted lg:hidden">{title ?? s.project.name}</span>}
        <DeskTabs />
        <div className={cn('mr-auto items-center', home ? 'flex' : 'hidden lg:flex')}>
            <button onClick={() => nav('/app/updates')} aria-label={pending ? `התראות (${pending})` : 'התראות'} className="grid h-12 w-12 place-items-center">
              <Icon name="alert" />
            </button>
            <button onClick={() => nav('/app/profile')} aria-label="פרופיל" className="grid h-12 w-12 place-items-center">
              <Icon name="account" />
            </button>
        </div>
      </header>
      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/app/home', label: 'בית', icon: 'home' },
  { to: '/app/budget', label: 'תקציב', icon: 'money' },
  { to: '/app/schedule', label: 'זמנים', icon: 'schedule' },
  { to: '/app/archive', label: 'ארכיון', icon: 'archive' },
];

/** Desktop: the nav-bar tabs in the app bar – same icons, blue when active with the yellow 24px line used by the app's tab rows */
function DeskTabs() {
  return (
    <nav className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-center gap-10 lg:flex">
      {tabs.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => cn('flex flex-col items-center gap-1 pt-2 text-caption', isActive ? 'font-medium text-primary' : 'text-ink hover:text-primary')}>
          {({ isActive }) => (
            <>
              <Icon name={icon} />
              {label}
              <span className={cn('h-0.5 w-6 rounded-full', isActive ? 'bg-accent' : 'bg-transparent')} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Figma "nav bar": white pill 72px high, 40px items 24px apart, 16px above the bottom (mobile only – desktop has the tabs in the app bar) */
export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-phone justify-center lg:hidden">
      <div className="pointer-events-auto flex h-[72px] items-center gap-6 rounded-full bg-white px-8 py-2 shadow-bar">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('flex w-10 flex-col items-center text-caption', isActive ? 'font-medium text-primary' : 'text-ink')}
          >
            <Icon name={icon} />
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
    <div className={cn('fixed inset-y-0 left-1/2 z-50 w-full max-w-phone -translate-x-1/2 overflow-hidden lg:left-0 lg:max-w-none lg:translate-x-0', open ? 'visible' : 'invisible')}>
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

/** Figma "label icon" row: 48px items 16px apart, 32px side padding; the selected one is blue with a 24px yellow line under it */
export function StageTabs({ items, active, onSelect }: { items: { id: string; label: string; icon: StageIcon }[]; active: string; onSelect: (id: string) => void }) {
  return (
    // spread across the 342px column so the six tabs fit the phone without sideways scrolling (scrolls only if a project has more stages)
    <div className="no-scrollbar relative z-[2] -mb-1.5 flex justify-between gap-2 overflow-x-auto px-6 pt-4 lg:justify-center lg:gap-4">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn('flex h-14 w-12 shrink-0 flex-col items-center gap-2 py-0.5 text-caption', active === t.id ? 'font-medium text-primary' : 'text-ink')}
        >
          <span className="flex flex-col items-center gap-0.5 whitespace-nowrap">
            <StageGlyph icon={t.icon} />
            {t.label}
          </span>
          {active === t.id && <span className="h-0.5 w-6 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}

/* ---------- Secondary page header (back arrow + title) ---------- */

export function PageHeader({ title, onBack, step }: { title: string; onBack?: () => void; step?: { n: number; of: number } }) {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-20 bg-white px-6 pb-2 pt-12 short:pt-5 lg:pt-8">
      <div className="desk-narrow">
      <div className="relative flex h-8 items-center justify-center">
        <button onClick={onBack ?? (() => nav(-1))} className="absolute right-0 text-ink" aria-label="חזרה">
          <ChevronRight size={24} strokeWidth={1.6} />
        </button>
        <span className="text-body text-muted">{title}</span>
      </div>
      {step && (
        <div className="mt-6 short:mt-3">
          <p className="px-2 text-caption text-ink">
            שלב {step.n} מתוך {step.of}
          </p>
          {/* Figma "progress indicator": 4px segments 8px apart in a 16px row; as in the Figma it fills from the left */}
          <div dir="ltr" className="flex h-4 items-center gap-2 px-0.5">
            {Array.from({ length: step.of }).map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < step.n ? 'bg-accent' : 'bg-line')} />
            ))}
          </div>
        </div>
      )}
      </div>
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
      <SheetCtx.Provider value="sheet">
        {/* Figma: white page, content-height sheet anchored to the bottom (rounded 24 top, 32px vertical padding) */}
        <div className="flex flex-1 flex-col bg-white lg:bg-bg lg:px-6 lg:pb-10">
          <div className="flex shrink-0 items-start px-6 pb-6 pt-12 lg:mx-auto lg:h-auto lg:w-full lg:max-w-xl lg:px-0 lg:pb-4 lg:pt-8">
            <button onClick={onBack ?? (() => nav(-1))} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm4" aria-label={`סגירת ${title}`}>
              <X size={18} />
            </button>
          </div>
          {/* Desktop: the same sheet, shown as a centered card */}
          {/* at least 152px below the top (Figma sheets are 696px on an 844px screen); taller forms grow upwards */}
          <div className="sheet-in mt-auto flex min-h-[calc(100dvh-152px)] flex-col rounded-t-3xl bg-white pt-8 shadow-bar lg:mx-auto lg:mt-0 lg:min-h-0 lg:w-full lg:max-w-xl lg:flex-none lg:rounded-3xl">{children}</div>
        </div>
      </SheetCtx.Provider>
    );
  // Figma "login-step *": white page; the action button follows the content (see BottomActions)
  return (
    <SheetCtx.Provider value={step ? 'step' : 'page'}>
      <div className="flex flex-1 flex-col bg-white">
        <PageHeader title={title} step={step} onBack={onBack} />
        <div className="page-in animate-fade-up desk-narrow flex w-full flex-1 flex-col">{children}</div>
      </div>
    </SheetCtx.Provider>
  );
}

/** where a Heading sits: a bottom sheet, a plain page, or a page whose header shows the step progress */
const SheetCtx = createContext<'sheet' | 'page' | 'step' | undefined>(undefined);

export function Heading({ title, sub }: { title: string; sub?: string }) {
  const ctx = useContext(SheetCtx);
  // Figma sheet heading: H3 title + body sub, 16px vertical padding, then 24px to the first field
  if (ctx === 'sheet')
    return (
      <div className="px-6 pb-10 pt-4 text-center">
        <h1 className="font-display text-h3 font-bold">{title}</h1>
        {sub && <p className="text-body text-ink">{sub}</p>}
      </div>
    );
  // Figma "login-step *": 32px under the header bar, H3 title, 8px, body sub; 16px padding, then 24px to the content
  return (
    // with the step progress above it the title sits 16px under the bar
    <div className={cn('px-6 pb-10 text-center short:pb-6', ctx === 'step' ? 'pt-4' : 'pt-12 short:pt-6')}>
      <h1 className="font-display text-h3 font-bold">{title}</h1>
      {sub && <p className="mt-2 text-body text-ink">{sub}</p>}
    </div>
  );
}
