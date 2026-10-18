import { Camera, Check, CheckCircle2, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { pickImages } from '@/lib/files';
import { cn } from '@/lib/format';

/* ---------- Buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; size?: 'md' | 'sm'; block?: boolean };

export function Button({ variant = 'primary', size = 'md', block, className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full text-btn font-medium transition active:scale-[0.98] disabled:cursor-not-allowed',
        size === 'md' ? 'h-10 px-6' : 'h-8 px-4',
        block && 'w-full',
        variant === 'primary' && 'bg-primary text-white shadow-blue hover:bg-[#2b97e8] disabled:bg-disabled disabled:text-muted disabled:shadow-none',
        variant === 'outline' && 'border border-primary bg-white text-ink hover:bg-primary-50 disabled:border-line disabled:text-muted',
        variant === 'ghost' && 'text-ink hover:bg-primary-50',
        className,
      )}
    />
  );
}

export function IconButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-ink shadow-blue transition hover:bg-primary-100', className)}
    />
  );
}

/** Sticky bottom action area used on form screens */
export function BottomActions({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-10 mt-auto flex gap-3 bg-gradient-to-t from-[color:var(--surface)] via-[color:var(--surface)] to-transparent px-6 pb-8 pt-6">{children}</div>;
}

/* ---------- Form fields ---------- */

export function Field({ label, hint, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1 block text-caption text-muted">{label}</span>}
      <input {...p} className="field" />
      {hint && <span className="mt-1 block text-caption text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, max = 300, value, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; max?: number; value: string }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-lg font-medium">{label}</span>}
      <div className="rounded-lg border border-primary-100 bg-white p-3 focus-within:border-primary">
        <textarea {...p} value={value} maxLength={max} rows={4} className="w-full resize-none bg-transparent text-body placeholder:text-muted focus:outline-none" />
        <div className="text-left text-caption text-muted">
          {value.length}/{max}
        </div>
      </div>
    </label>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: ReactNode }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center gap-3 text-right">
      <span className={cn('grid h-5 w-5 place-items-center rounded border-2 transition', checked ? 'border-primary bg-primary text-white' : 'border-muted bg-white')}>
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      {label && <span className="text-body">{label}</span>}
    </button>
  );
}

export function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center gap-2">
      <span className={cn('grid h-5 w-5 place-items-center rounded-full border-2', checked ? 'border-ink' : 'border-muted')}>
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      <span className="text-body">{label}</span>
    </button>
  );
}

/** Choice pills (e.g. stage picker, project type) */
export function Pills<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value?: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 rounded-full border px-4 text-caption transition',
            value === o.value ? 'border-primary bg-primary text-white' : 'border-primary-200 bg-white text-ink hover:bg-primary-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ children, tone = 'blue', className }: { children: ReactNode; tone?: 'blue' | 'yellow' | 'red' | 'orange' | 'green'; className?: string }) {
  const tones = {
    blue: 'bg-primary-100 text-ink',
    yellow: 'bg-accent text-ink',
    red: 'bg-danger-soft text-danger',
    orange: 'bg-warn text-white',
    green: 'bg-success-soft text-success-dark',
  };
  return <span className={cn('inline-flex h-5 items-center rounded-full px-2 text-caption', tones[tone], className)}>{children}</span>;
}

/* ---------- Progress ---------- */

export function ProgressBar({ value, className, color = 'bg-accent' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Circle with percentage (stage cards) */
export function Ring({ value, size = 56, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#3DA5F4"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-caption font-semibold text-ink">{value}%</span>
    </div>
  );
}

/** Half-circle gauge (home budget card) */
export function Gauge({ value, children }: { value: number; children?: ReactNode }) {
  const r = 110;
  const len = Math.PI * r;
  return (
    <div className="relative mx-auto w-[260px]">
      <svg viewBox="0 0 260 140" className="w-full">
        <path d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="#F0F1F3" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M20 130 A110 110 0 0 1 240 130"
          fill="none"
          stroke="#FFC72C"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - Math.min(1, value))}
          style={{ transform: 'scaleX(-1)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">{children}</div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function Avatar({ src, size = 40, name }: { src?: string; size?: number; name?: string }) {
  return src ? (
    <img src={src} alt={name ?? ''} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span className="checker grid shrink-0 place-items-center rounded-full text-caption ring-2 ring-white" style={{ width: size, height: size }}>
      {name?.[0]}
    </span>
  );
}

export function AvatarStack({ srcs, size = 24 }: { srcs: string[]; size?: number }) {
  return (
    <div className="flex -space-x-2 space-x-reverse">
      {srcs.map((s, i) => (
        <Avatar key={i} src={s} size={size} />
      ))}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-h3 font-bold">{children}</h2>
      {action}
    </div>
  );
}

/** Photo/file slot with checkerboard placeholder */
export function UploadSlot({ filled, onAdd, onRemove, className, label }: { filled?: string | boolean; onAdd: () => void; onRemove?: () => void; className?: string; label?: string }) {
  return (
    <div className={cn('relative aspect-[162/136] overflow-hidden rounded-lg', filled ? 'bg-muted' : 'checker', className)}>
      {typeof filled === 'string' && <img src={filled} className="h-full w-full object-cover" alt="" />}
      {filled ? (
        onRemove && (
          <button onClick={onRemove} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-sm4" aria-label="הסר">
            <X size={16} />
          </button>
        )
      ) : (
        <button onClick={onAdd} className="absolute inset-0 grid place-items-center" aria-label={label ?? 'הוספה'}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-2xl font-light text-muted shadow-sm4">+</span>
        </button>
      )}
      {filled && label && <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 text-caption">{label}</span>}
    </div>
  );
}

/** Camera / gallery chooser used wherever photos are added (designer note: "גלריה או לצלם") */
export function PhotoSourceButtons({ onPick, multiple }: { onPick: (imgs: string[]) => void; multiple?: boolean }) {
  const pick = (capture: boolean) => pickImages({ multiple: multiple && !capture, capture }).then((imgs) => imgs.length && onPick(imgs));
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => pick(true)} className="flex h-8 items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 text-caption">
        <Camera size={14} className="text-primary" /> מצלמה
      </button>
      <button type="button" onClick={() => pick(false)} className="flex h-8 items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 text-caption">
        <ImageIcon size={14} className="text-primary" /> גלריה
      </button>
    </div>
  );
}

export function PhotoPicker({ photos, onChange, max = 6 }: { photos: string[]; onChange: (p: string[]) => void; max?: number }) {
  const add = (imgs: string[]) => onChange([...photos, ...imgs].slice(0, max));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-medium">תמונות</span>
        {photos.length < max && <PhotoSourceButtons onPick={add} multiple />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p, i) => (
          <UploadSlot key={i} filled={p} onAdd={() => {}} onRemove={() => onChange(photos.filter((_, j) => j !== i))} />
        ))}
        {photos.length < max && <UploadSlot onAdd={() => pickImages({ multiple: true }).then(add)} label="הוסף תמונה" />}
      </div>
      <p className="mt-2 text-caption text-muted">ניתן להוסיף עד {max} תמונות</p>
    </div>
  );
}

/** Dropdown with a check-marked option list (Figma: "בחר שלב בנייה", "הרשאה") */
export function Select<T extends string>({ placeholder, options, value, onChange, className }: { placeholder: string; options: { value: T; label: string }[]; value?: T; onChange: (v: T) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className={cn('overflow-hidden rounded-lg border border-primary-100 bg-white', className)}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between bg-bg px-4 py-3 text-body">
        <span className={current ? 'text-ink' : 'text-muted'}>{current?.label ?? placeholder}</span>
        <ChevronDown size={18} className={cn('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="py-1">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-6 py-2.5 text-body hover:bg-primary-50"
              >
                {o.label}
                {o.value === value && <Check size={18} className="text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Centered modal (popups like FAQ, new card, exception details). Close button floats above the card, as in Figma. */
export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-fade-up relative w-full max-w-[342px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm4" aria-label="סגור">
          <X size={18} />
        </button>
        <div className="max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-bar">
          {title && <h3 className="mb-4 font-display text-h2 font-bold">{title}</h3>}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Approve / reject confirmation (designer note: same popup for updates and exceptions) */
export function ConfirmDialog({
  open,
  onClose,
  title,
  text,
  onApprove,
  onReject,
  approveLabel = 'אישור',
  rejectLabel = 'דחייה',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  text?: ReactNode;
  onApprove: () => void;
  onReject?: (reason: string) => void;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const close = () => {
    setRejecting(false);
    setReason('');
    onClose();
  };
  return (
    <Modal open={open} onClose={close}>
      <div className="space-y-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary">
          <CheckCircle2 size={30} strokeWidth={1.5} />
        </span>
        <h3 className="font-display text-h2 font-bold">{title}</h3>
        {text && <div className="text-body text-muted">{text}</div>}
        {rejecting && (
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="סיבת הדחייה (תישלח לכותב)"
            className="field resize-none text-right"
          />
        )}
        <div className="flex gap-3">
          {rejecting ? (
            <Button
              className="flex-1"
              onClick={() => {
                onReject?.(reason);
                close();
              }}
            >
              שליחת דחייה
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => {
                onApprove();
                close();
              }}
            >
              {approveLabel}
            </Button>
          )}
          {onReject && (
            <Button variant="outline" className="flex-1" onClick={() => (rejecting ? setRejecting(false) : setRejecting(true))}>
              {rejecting ? 'חזרה' : rejectLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Full-screen photo viewer with swipe-free prev/next */
export function Lightbox({ images, index, onClose }: { images: { src: string; caption?: string }[]; index: number | null; onClose: () => void }) {
  const [i, setI] = useState(index ?? 0);
  useEffect(() => {
    if (index !== null) setI(index);
  }, [index]);
  if (index === null || !images[i]) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" onClick={onClose}>
      <div className="flex items-center justify-between p-4">
        <span className="text-caption">
          {i + 1} / {images.length}
        </span>
        <button onClick={onClose} aria-label="סגור">
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-2" onClick={(e) => e.stopPropagation()}>
        <img src={images[i].src} alt="" className="max-h-[75vh] max-w-full rounded-lg object-contain" />
      </div>
      <div className="flex items-center justify-between p-6" onClick={(e) => e.stopPropagation()}>
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full bg-white/10 px-4 py-2 text-body disabled:opacity-30">
          הקודם
        </button>
        <span className="text-body">{images[i].caption}</span>
        <button disabled={i === images.length - 1} onClick={() => setI(i + 1)} className="rounded-full bg-white/10 px-4 py-2 text-body disabled:opacity-30">
          הבא
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-primary-200 p-6 text-center text-body text-muted">{children}</div>;
}
