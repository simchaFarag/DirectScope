export const ils = (n: number) => `₪ ${Math.round(n).toLocaleString('en-US')}`;

/**
 * Amount fields take whole shekels – amounts are saved without agorot, and "12,500.50" used to be saved as 12,501 without
 * a word. A typed decimal point stays visible but nothing is added after it, so it's clear agorot aren't taken.
 * (Dropping only the point would glue the agorot on and multiply the amount by 100: 12500.75 → ₪1,250,075.)
 * Commas, spaces and ₪ are dropped (pasted "12,500" stays 12500). Max 9 digits – the server caps amounts at ₪1B.
 */
export function moneyInput(v: string) {
  const [int = '', ...rest] = v.replace(/[^\d.]/g, '').split('.');
  return int.slice(0, 9) + (rest.length ? '.' : '');
}

/** The amount to save from a money field (whole shekels). */
export const shekels = (v: string) => Math.round(Number(v) || 0);

/** Money field shown as "₪ 12,500" while typing, keeping a decimal part that is being typed ("₪ 12,500.7"). */
export function moneyText(v: string) {
  if (!v) return '';
  const [int, dec] = v.split('.');
  return `₪ ${Number(int || 0).toLocaleString('en-US')}${dec !== undefined ? '.' + dec : ''}`;
}

/** "זמן עבודה" from a stage's dates: 5 ימים / שבוע / שבועיים / 3 שבועות */
export function durationLabel(start: string, end: string) {
  if (!start || !end || end < start) return '';
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  if (days < 7) return days === 1 ? 'יום' : `${days} ימים`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? 'שבוע' : weeks === 2 ? 'שבועיים' : `${weeks} שבועות`;
}

/** Thousands for the "אלף ש״ח" figures: one decimal below 100K (3,500 → 3.5, not 4), whole numbers above. */
export const thousands = (n: number) => {
  const k = n / 1000;
  return Math.abs(k) < 100 ? String(Math.round(k * 10) / 10) : Math.round(k).toLocaleString('en-US');
};

/** 2026-04-16 → 16.04.2026 (or 16.04 when short) */
export function fmtDate(iso: string, short = false) {
  const [y, m, d] = iso.split('-');
  return short ? `${d}.${m}` : `${d}.${m}.${y}`;
}

export const ordinal = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי'];
export const stageLabel = (order: number) => `שלב ${ordinal[order - 1] ?? order}:`;

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
