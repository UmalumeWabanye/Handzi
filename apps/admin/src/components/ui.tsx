import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2, type LucideIcon } from 'lucide-react';
import markUrl from '../../../../handzi-brand/logo/handzi-mark.svg';

// BRAND.md §6 buttons: primary Brick/white · secondary Sunshine/Charcoal · outline 1.5px Charcoal · ghost Brick text · destructive Danger/white.
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-hz-brick text-white hover:bg-hz-brick-dark border-hz-brick',
  secondary: 'bg-hz-sunshine text-hz-charcoal hover:bg-hz-sunshine-dark border-hz-sunshine',
  outline: 'bg-white text-hz-charcoal hover:bg-hz-chalk border-hz-charcoal border-[1.5px]',
  ghost: 'bg-transparent text-hz-brick hover:bg-hz-chalk border-transparent',
  danger: 'bg-hz-danger text-white hover:brightness-90 border-hz-danger',
  // TODO(brand): the kit defines no "confirm" button; approvals use Success with white text (approved pair).
  success: 'bg-hz-success text-white hover:brightness-90 border-hz-success',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; icon?: LucideIcon; loading?: boolean };

export function Button({ variant = 'outline', size = 'md', icon: Icon, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-[background-color,filter,transform,opacity] duration-200 ease-hz active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'h-10 px-3 text-small' : 'h-12 px-5 text-body',
        VARIANTS[variant],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export type Tone = 'neutral' | 'brand' | 'handy' | 'success' | 'warning' | 'danger';
// Badges: highlights on Sunshine/Charcoal; status colours with white text (approved pairs, BRAND.md §3.3).
// TODO(brand): the kit has no warning colour, so "needs attention" uses Sunshine.
const TONES: Record<Tone, string> = {
  neutral: 'bg-hz-chalk text-hz-steel ring-1 ring-inset ring-hz-line',
  brand: 'bg-hz-sunshine text-hz-charcoal',
  handy: 'bg-hz-info text-white',
  success: 'bg-hz-success text-white',
  warning: 'bg-hz-sunshine text-hz-charcoal',
  danger: 'bg-hz-danger text-white',
};

export function Badge({ tone = 'neutral', children, icon: Icon }: { tone?: Tone; children: ReactNode; icon?: LucideIcon }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-semibold', TONES[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/** Status → badge tone, shared across pages. */
export function statusTone(status?: string): Tone {
  switch (status) {
    case 'active':
    case 'verified':
    case 'confirmed':
    case 'released':
    case 'resolved':
    case 'actioned':
    case 'open':
      return status === 'open' ? 'brand' : 'success';
    case 'pending':
    case 'awaiting_payment':
    case 'completed':
    case 'under_review':
    case 'assigned':
      return 'warning';
    case 'suspended':
    case 'banned':
    case 'rejected':
    case 'disputed':
    case 'removed':
      return 'danger';
    case 'funded':
    case 'in_progress':
    case 'held':
      return 'handy';
    default:
      return 'neutral';
  }
}

export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <div className={clsx('rounded-lg border border-hz-line bg-white', padded && 'p-5', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="font-display text-h1 text-hz-charcoal">{title}</h1>
        {description && <p className="mt-1 text-small text-hz-steel">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// Inputs: white, 1px Line, radius 10, 48 high, 16px text, 3px Safety Orange focus ring (BRAND.md §6).
const field = 'w-full rounded-md border border-hz-line bg-white px-3 text-body text-hz-charcoal placeholder:text-hz-steel transition-shadow duration-200 focus:border-hz-orange focus:outline-none focus:ring-[3px] focus:ring-hz-orange';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={clsx(field, 'h-12', className)} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={clsx(field, 'h-12 pr-8', className)}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={clsx(field, 'min-h-[96px] py-2', className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-small font-semibold text-hz-charcoal">{label}</span>
      {children}
      {hint && <span className="block text-xs text-hz-steel">{hint}</span>}
    </label>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-hz-steel', className)} aria-label="Loading" />;
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

/** Handzi mark + one friendly line (BRAND.md §6). `icon` is kept for call sites. */
export function EmptyState({ title, text }: { icon?: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center animate-fade-in">
      <img src={markUrl} alt="" className="mb-1 h-12 w-12" />
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-hz-steel">{text}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-hz-danger bg-white px-4 py-3 text-small text-hz-danger">
      {message}
    </div>
  );
}

export function Avatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
  return src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full bg-hz-chalk object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-hz-sunshine text-caption font-bold text-hz-charcoal">
      {initials || '?'}
    </span>
  );
}

/** Simple responsive table. Rows animate in; the whole row is clickable when onRowClick is given. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: {
  columns: { header: string; cell: (row: T) => ReactNode; className?: string }[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-hz-line text-xs font-semibold uppercase tracking-wide text-hz-steel">
            {columns.map((c) => (
              <th key={c.header} className={clsx('px-4 py-3 font-semibold', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(r) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
              className={clsx('border-b border-hz-line last:border-0 animate-fade-in', onRowClick && 'cursor-pointer transition-colors hover:bg-hz-chalk')}
            >
              {columns.map((c) => (
                <td key={c.header} className={clsx('px-4 py-3 align-middle', c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-hz-line px-4 py-3 text-sm text-hz-steel">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-md bg-hz-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
            o.value === value ? 'bg-white text-hz-charcoal shadow-card' : 'text-hz-steel hover:text-hz-charcoal'
          )}
        >
          {o.label}
          {o.count ? <span className="ml-1.5 text-xs text-hz-steel">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
