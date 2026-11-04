import { CheckCircle2, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Toast = { id: number; text: string; tone: 'success' | 'info' };
const Ctx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});

/** Shows a toast from code outside React components (e.g. src/lib/files.ts) */
export const notify = (text: string, tone: Toast['tone'] = 'info') => window.dispatchEvent(new CustomEvent('ds:toast', { detail: { text, tone } }));

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
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
      <div className="pointer-events-none fixed inset-x-0 top-6 z-[60] mx-auto flex max-w-phone flex-col items-center gap-2 px-6">
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
