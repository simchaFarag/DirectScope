export const ils = (n: number) => `₪ ${Math.round(n).toLocaleString('en-US')}`;

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
