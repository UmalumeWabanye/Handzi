export const rand = (n?: number | null) => (n == null ? '—' : `R${Math.round(n).toLocaleString('en-ZA').replace(/[, ]/g, ' ')}`);
export const num = (n?: number | null) => (n == null ? '—' : n.toLocaleString('en-ZA').replace(/[, ]/g, ' '));

export const date = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const dateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export function ago(d?: string | Date | null) {
  if (!d) return '—';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return date(d);
}

export const name = (u?: { firstName?: string; lastName?: string } | null) => (u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—' : '—');
export const humanize = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—');
