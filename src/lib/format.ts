export const ils = (n: number) => `₪ ${Math.round(n).toLocaleString('en-US')}`;

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
