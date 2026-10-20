import { Camera, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { pickImages } from '@/lib/files';
import { cn } from '@/lib/format';
import { Icon } from './FigmaIcon';

/* ---------- Buttons ---------- */

/** Figma "buttoמs": primary = cta, outline = secondary, soft = role 3, ghost = no BG. Pressed = inner shadow. */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'soft' | 'ghost'; size?: 'md' | 'sm'; block?: boolean };

export function Button({ variant = 'primary', size = 'md', block, className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full text-btn font-medium tracking-[0.042px] transition enabled:active:shadow-[inset_0_4px_4px_rgba(0,46,88,0.3)] disabled:cursor-not-allowed disabled:bg-[#F0F1F3] disabled:text-[#838C9D]',
        size === 'md' ? 'h-10' : 'h-8',
        variant === 'ghost' ? 'px-4' : block ? 'px-6' : size === 'md' ? 'px-8' : 'px-6',
        block && 'w-full',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'outline' && cn('border-primary bg-bg text-ink disabled:border-line', block ? 'border-[1.5px]' : 'border-[1.2px]'),
        variant === 'soft' && 'bg-primary-100 text-ink',
        variant === 'ghost' && 'text-ink disabled:bg-transparent',
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

/** Sticky bottom action area used on form screens. `inline`: the button follows the fields (Figma: inspiration upload, add receipt) */
export function BottomActions({ children, inline }: { children: ReactNode; inline?: boolean }) {
  // On desktop the actions follow the content instead of sinking to the bottom of a tall window
  return <div className={cn('sticky bottom-0 z-10 flex gap-4 lg:mt-2 bg-gradient-to-t from-[color:var(--surface)] via-[color:var(--surface)] to-transparent px-6 pb-8 short:pb-4', inline ? 'pt-6' : 'mt-auto pt-6 short:pt-3', '[.sheet-in_&]:mt-0 [.sheet-in_&]:pt-8 [.page-in_&]:mt-0 [.page-in_&]:pt-10')}>{children}</div>;
}

/* ---------- Form fields ---------- */

/** Figma "Text field – with label": 12px label (8px inset) 2px above a 40px box */
export function Field({ label, hint, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-0.5 block px-2 text-caption text-ink">{label}</span>}
      <input {...p} className="field" />
      {hint && <span className="mt-1 block text-caption text-muted">{hint}</span>}
    </label>
  );
}

/**
 * Figma filled text field: value + clear (×) on the left. `tel` shows a muted "+972" before the number and reads left-to-right
 * ("+972 527683159 … ×"); `suffix` goes before the clear button; `className` sets the height (40px by default).
 */
export function ClearField({ value, onChange, placeholder, tel, suffix, className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; tel?: boolean; suffix?: ReactNode; className?: string; autoFocus?: boolean }) {
  return (
    <div dir={tel && value ? 'ltr' : undefined} className={cn('flex h-10 min-w-0 items-center gap-2 rounded-lg border border-primary-100 bg-white px-4 focus-within:border-primary', className)}>
      {tel && value && <span className="text-body text-muted">+972</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode={tel ? 'tel' : undefined} autoFocus={autoFocus} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-muted focus:outline-none" />
      {suffix}
      {value && (
        <button type="button" onClick={() => onChange('')} className="shrink-0 text-ink" aria-label={`ניקוי ${placeholder}`}>
          <X size={20} strokeWidth={1.2} />
        </button>
      )}
    </div>
  );
}

export function TextArea({ label, max = 300, value, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; max?: number; value: string }) {
  return (
    <label className="block">
      {label && <span className="mb-0.5 block px-2 text-caption text-ink">{label}</span>}
      {/* Figma: 128px box, 16px top/right, 8px bottom/left, counter at the bottom */}
      <div className="flex h-32 flex-col rounded-lg border border-primary-100 bg-white pb-2 pl-2 pr-4 pt-4 focus-within:border-primary">
        <textarea {...p} value={value} maxLength={max} className="w-full flex-1 resize-none bg-transparent text-body placeholder:text-muted focus:outline-none" />
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
      {/* Figma "Checkbox": 16px square in a 24px hit area; empty = white with gray border, filled = blue with a check */}
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        <span className={cn('grid h-4 w-4 place-items-center rounded-sm transition', checked ? 'bg-primary text-bg' : 'border border-[#BFC4CD] bg-white')}>
          {checked && <Icon name="checkmark" size={14} />}
        </span>
      </span>
      {label && <span className="text-body">{label}</span>}
    </button>
  );
}

export function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    /* Figma "Radio Button": label, then the 24px radio */
    <button type="button" onClick={onChange} className="flex items-center gap-2.5">
      <span className="text-body">{label}</span>
      <span className="grid h-6 w-6 place-items-center">
        <span className={cn('grid h-5 w-5 place-items-center rounded-full border-2', checked ? 'border-ink' : 'border-muted')}>{checked && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}</span>
      </span>
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

/** 8px rounded bar; as in the Figma the yellow fill grows from the left */
export function ProgressBar({ value, className, color = 'bg-accent' }: { value: number; className?: string; color?: string }) {
  return (
    <div dir="ltr" className={cn('h-2 w-full overflow-hidden rounded-full bg-white', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Circle with percentage (Figma "level card": 52px, white track, blue arc, 14px medium label) */
export function Ring({ value, size = 52 }: { value: number; size?: number }) {
  const stroke = (size * 3.24) / 52;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={(size * 2.9) / 52} fill="none" />
        {value > 0 && <circle cx={size / 2} cy={size / 2} r={r} stroke="#3DA5F4" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />}
      </svg>
      <span className="absolute text-btn font-medium tracking-[0.042px] text-primary">{value}%</span>
    </div>
  );
}

/** Half-circle gauge (home budget card, Figma 242×124): light track, yellow fill growing from the right end */
export function Gauge({ value, children }: { value: number; children?: ReactNode }) {
  const cx = 121;
  const cy = 120;
  const r = 114;
  const right = -Math.asin(6 / r);
  const span = Math.PI - 2 * Math.asin(6 / r);
  const pt = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative mx-auto h-[124px] w-[242px]">
      <svg viewBox="0 0 242 124" className="absolute inset-0 overflow-visible" fill="none">
        <defs>
          <filter id="gaugeTrack" x="-10" y="-10" width="262" height="144" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#1F4E79" floodOpacity="0.2" />
          </filter>
          <filter id="gaugeFill" x="-20" y="-20" width="282" height="164" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3EA5F4" floodOpacity="0.1" />
          </filter>
        </defs>
        <path d={`M${pt(right - span)} A${r} ${r} 0 0 1 ${pt(right)}`} stroke="#F7F9FC" strokeWidth={12} strokeLinecap="round" filter="url(#gaugeTrack)" />
        {v > 0 && <path d={`M${pt(right)} A${r} ${r} 0 0 0 ${pt(right - span * v)}`} stroke="#FFC72C" strokeWidth={12} strokeLinecap="round" filter="url(#gaugeFill)" />}
      </svg>
      <div className="absolute left-1/2 top-[calc(50%+34px)] flex w-[340px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">{children}</div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function Avatar({ src, size = 40, name }: { src?: string; size?: number; name?: string }) {
  return src ? (
    <img src={src} alt={name ?? ''} className="shrink-0 rounded-full border border-primary-100 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="checker grid shrink-0 place-items-center rounded-full border border-primary-100 text-caption" style={{ width: size, height: size }}>
      {name?.[0]}
    </span>
  );
}

/** Figma "avatars" group: 24px avatars overlapping by 2px */
export function AvatarStack({ srcs, size = 24 }: { srcs: string[]; size?: number }) {
  return (
    <div className="flex -space-x-0.5 space-x-reverse">
      {srcs.map((s, i) => (
        <Avatar key={i} src={s} size={size} />
      ))}
    </div>
  );
}

/** Figma "divider" (state=high): 8px wide, light-blue 1.5px line */
export function VDivider() {
  return (
    <span className="flex w-2 shrink-0 justify-center self-stretch py-[0.75px]">
      <span className="w-[1.5px] rounded-full bg-primary-100" />
    </span>
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
          // Figma "doc square – לאחר העלאה": 32px white button with the 24px close icon, top right
          <button onClick={onRemove} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-[0_0_5px_rgba(62,165,244,0.1)]" aria-label={label ? `הסרת ${label}` : 'הסר'}>
            <X size={20} strokeWidth={1.2} />
          </button>
        )
      ) : (
        <button onClick={onAdd} className="absolute inset-0 grid place-items-center" aria-label={label ?? 'הוספה'}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-[0_0_5px_rgba(62,165,244,0.1)]">
            <Icon name="add" />
          </span>
        </button>
      )}
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
        <span className="text-body text-ink">תמונות</span>
        {photos.length < max && <PhotoSourceButtons onPick={add} multiple />}
      </div>
      <div className="grid grid-cols-2 gap-x-[18px] gap-y-2">
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
/**
 * Figma "Text field – dropdown": 40px, 16px padding, chevron on the left. Open: light header, 32px rows,
 * the chosen row on primary-50 with a check after the label.
 * `detail`: content shown under one option while it is chosen (Figma "אחר" → "פרט את ההוצאה"); choosing it keeps the list open.
 */
export function Select<T extends string>({ placeholder, options, value, onChange, className, detail }: { placeholder: string; options: { value: T; label: string }[]; value?: T; onChange: (v: T) => void; className?: string; detail?: { value: T; node: ReactNode } }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const showDetail = detail && value === detail.value;
  return (
    <div className={cn('overflow-hidden rounded-lg border border-primary-100 bg-white', className)}>
      <button type="button" onClick={() => setOpen(!open)} className={cn('flex h-10 w-full items-center justify-between gap-4 px-4 text-body', open && 'bg-bg')}>
        <span className={current && !open ? 'text-ink' : 'text-muted'}>{open ? placeholder : (current?.label ?? placeholder)}</span>
        <Icon name="down" />
      </button>
      {open && (
        <ul className="flex flex-col gap-2.5 pt-4">
          {options.map((o) => {
            const sel = o.value === value;
            return (
              <li key={o.value} className={cn('px-6', sel && showDetail ? 'flex flex-col gap-2 bg-primary-50 py-2' : 'last:pb-4')}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    if (detail?.value !== o.value) setOpen(false);
                  }}
                  className="flex items-center gap-4 py-1 text-body"
                >
                  {o.label}
                  {sel && <Icon name="yes" className="text-primary" />}
                </button>
                {sel && showDetail && detail.node}
              </li>
            );
          })}
        </ul>
      )}
      {!open && showDetail && <div className="border-t border-primary-100 bg-primary-50 px-6 py-2">{detail.node}</div>}
    </div>
  );
}

/** Centered modal (popups like FAQ, new card, exception details). Close button floats above the card, as in Figma. */
export function Modal({ open, onClose, children, title, closeLeft }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; closeLeft?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-fade-up relative w-full max-w-[342px] lg:max-w-[440px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={cn('absolute -top-12 grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm4', closeLeft ? 'left-0' : 'right-0')} aria-label="סגור">
          <X size={18} />
        </button>
        {/* Figma popups: 24px radius, 24px sides / 32px top-bottom, H3 title 24px above the content */}
        <div className="max-h-[80vh] overflow-y-auto rounded-3xl bg-white px-6 py-8 shadow-bar">
          {title && <h3 className="mb-6 font-display text-h3 font-bold">{title}</h3>}
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
