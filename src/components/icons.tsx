import { Hammer, Hash, LayoutGrid, ReceiptText, Zap, type LucideProps } from 'lucide-react';
import type { StageIcon } from '@/data/types';

type P = LucideProps;

/** Money bag – used for the "תקציב" tab (no lucide equivalent) */
export function MoneyBag({ size = 24, strokeWidth = 1.6, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...(p as object)}>
      <path d="M9 3h6l-1.5 3.5h-3L9 3Z" />
      <path d="M10.5 6.5C6.5 8 4 12 4 15.5 4 19 6.5 21 12 21s8-2 8-5.5c0-3.5-2.5-7.5-6.5-9" />
      <path d="M10 10.5h4" />
    </svg>
  );
}

/** Pipe – used for "צנרת" */
export function Pipe({ size = 24, strokeWidth = 1.6, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...(p as object)}>
      <path d="M3 5h8v5h5v9" />
      <path d="M3 9h4v5h5v5" />
      <path d="M3 4v6M11 19h6" />
    </svg>
  );
}

/** Two stacked rounded rects – "כללי" */
export function General({ size = 24, strokeWidth = 1.6, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} {...(p as object)}>
      <rect x="4" y="3" width="6" height="9" rx="3" />
      <rect x="14" y="3" width="6" height="6" rx="3" />
      <rect x="4" y="15" width="6" height="6" rx="3" />
      <rect x="14" y="12" width="6" height="9" rx="3" />
    </svg>
  );
}

export function StageGlyph({ icon, ...p }: { icon: StageIcon } & P) {
  switch (icon) {
    case 'demolition':
      return <Hammer {...p} />;
    case 'plumbing':
      return <Pipe {...p} />;
    case 'electric':
      return <Zap {...p} />;
    case 'ceramic':
      return <Hash {...p} />;
    case 'extras':
      return <ReceiptText {...p} />;
    default:
      return <General {...p} />;
  }
}

export { LayoutGrid };
