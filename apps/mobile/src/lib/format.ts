const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES = MONTHS;

export const rand = (n?: number | null) =>
  n == null ? '' : `R${Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ')}`;

export const monthYear = (d?: string | Date | null) => {
  if (!d) return '';
  const date = new Date(d);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** "3 yrs 2 mos" between two dates (end defaults to now). */
export function duration(start: string | Date, end?: string | Date | null) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  months = Math.max(months, 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}

export const placeLabel = (p?: { suburb?: string; city?: string; province?: string } | null) =>
  p ? [p.suburb, p.city].filter(Boolean).join(', ') || p.province || '' : '';

/** plural(2, 'quote') → "2 quotes"; pass the plural form for irregular words. */
export const plural = (n: number, word: string, many?: string) => `${n} ${n === 1 ? word : many ?? `${word}s`}`;

export const EMPLOYMENT_LABELS: Record<string, string> = {
  self_employed: 'Self-employed',
  employed: 'Employed',
  contract: 'Contract',
  apprenticeship: 'Apprenticeship',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a date. */
export function timeAgo(d: string | Date) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "Today", "Tomorrow", or "Wed 3 Dec". */
export function dayLabel(d: string | Date) {
  const date = new Date(d);
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function budgetLabel(b?: { min?: number | null; max?: number | null } | null) {
  if (!b || (b.min == null && b.max == null)) return 'Open to quotes';
  if (b.min != null && b.max != null) return `${rand(b.min)} – ${rand(b.max)}`;
  if (b.max != null) return `Up to ${rand(b.max)}`;
  return `From ${rand(b.min)}`;
}
