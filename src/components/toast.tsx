import { CheckCircle2, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Toast = { id: number; text: string; tone: 'success' | 'info' };
const Ctx = createContext<(text: string, tone?: Toast['tone'], ms?: number) => void>(() => {});

/** Shows a toast from code outside React components (e.g. src/lib/files.ts) */
export const notify = (text: string, tone: Toast['tone'] = 'info') => window.dispatchEvent(new CustomEvent('ds:toast', { detail: { text, tone } }));

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  /** `ms`: longer for a message the user has to act on (default 2.6s) */
  const show = useCallback((text: string, tone: Toast['tone'] = 'success', ms = 2600) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  useEffect(() => {
    const on = (e: Event) => {
      const { text, tone } = (e as CustomEvent<{ text: string; tone: Toast['tone'] }>).detail;
      show(text, tone);
    };
    window.addEventListener('ds:toast', on);
    return () => window.removeEventListener('ds:toast', on);
  }, [show]);
  return (
    <Ctx.Provider value={show}>
      {children}
      {/* on a computer the top centre is the tab bar – the toasts covered בית / תקציב / זמנים for 2.6s; they show at the bottom there */}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-[60] mx-auto flex max-w-phone flex-col items-center gap-2 px-6 lg:bottom-8 lg:top-auto">
        {toasts.map((t) => (
          <div key={t.id} className="animate-fade-up flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-body text-white shadow-bar">
            {t.tone === 'success' ? <CheckCircle2 size={18} className="text-success" /> : <Info size={18} className="text-primary-300" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
