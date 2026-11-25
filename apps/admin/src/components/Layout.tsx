import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShieldCheck,
  Scale,
  Flag,
  Users,
  ClipboardList,
  CalendarCheck,
  Tags,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import logoOnDark from '../../../../handzi-brand/logo/handzi-logo-on-dark.svg';
import logoPrimary from '../../../../handzi-brand/logo/handzi-logo-primary.svg';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Queues } from '../lib/types';

type Item = { to: string; label: string; icon: LucideIcon; queue?: keyof Queues };
const SECTIONS: { title?: string; items: Item[] }[] = [
  { items: [{ to: '/', label: 'Overview', icon: LayoutDashboard }] },
  {
    title: 'Queues',
    items: [
      { to: '/verifications', label: 'Verifications', icon: ShieldCheck, queue: 'verifications' },
      { to: '/disputes', label: 'Disputes', icon: Scale, queue: 'disputes' },
      { to: '/reports', label: 'Reports', icon: Flag, queue: 'reports' },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/jobs', label: 'Jobs', icon: ClipboardList },
      { to: '/bookings', label: 'Bookings & payments', icon: CalendarCheck },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/categories', label: 'Categories', icon: Tags },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/audit', label: 'Audit log', icon: ScrollText },
    ],
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const queues = useQuery({ queryKey: ['queues'], queryFn: () => api<Queues>('/admin/queues'), refetchInterval: 30_000 });
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {SECTIONS.map((s, i) => (
        <div key={i}>
          {s.title && <p className="mb-1 px-3 text-caption font-semibold uppercase tracking-wider text-hz-mist">{s.title}</p>}
          <ul className="space-y-0.5">
            {s.items.map((it) => {
              const count = it.queue ? queues.data?.[it.queue] : undefined;
              return (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      clsx(
                        // Same pattern as the app's tab bar: Charcoal nav, Mist items, active in Sunshine (BRAND.md §6).
                        'flex min-h-touch items-center gap-3 rounded-md px-3 text-small font-medium transition-colors duration-200',
                        isActive ? 'bg-hz-graphite text-hz-sunshine' : 'text-hz-mist hover:bg-hz-graphite hover:text-white'
                      )
                    }
                  >
                    <it.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{it.label}</span>
                    {!!count && <span className="rounded-full bg-hz-sunshine px-2 py-0.5 text-caption font-bold text-hz-charcoal">{count}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-5 pb-4 pt-6">
      {/* Logo file used as-is; on-dark version for the Charcoal sidebar (BRAND.md §2.1). Min 120px wide. */}
      <img src={logoOnDark} alt="Handzi" className="w-[148px]" />
      <p className="mt-2 text-caption font-semibold uppercase tracking-wider text-hz-mist">Admin</p>
    </div>
  );
}

export function Layout({ children }: { children?: ReactNode }) {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const footer = (
    <div className="border-t border-hz-graphite p-3">
      <div className="flex items-center gap-3 rounded-md px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-white">
            {admin?.firstName} {admin?.lastName}
          </p>
          <p className="truncate text-caption text-hz-mist">{admin?.email}</p>
        </div>
        <button onClick={logout} className="flex h-12 w-12 items-center justify-center rounded-md text-hz-mist hover:bg-hz-graphite hover:text-white" aria-label="Log out" title="Log out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-hz-charcoal lg:flex">
        <Brand />
        <Nav />
        {footer}
      </aside>
      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hz-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-md hover:bg-hz-chalk" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <img src={logoPrimary} alt="Handzi" className="w-[120px]" />
        <span className="text-caption font-semibold uppercase tracking-wider text-hz-steel">Admin</span>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-hz-charcoal/50 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-hz-charcoal shadow-raised animate-slide-in">
            <Brand />
            <Nav onNavigate={() => setOpen(false)} />
            {footer}
          </aside>
        </div>
      )}
      <main className="lg:pl-64">
        <div key={location.pathname} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
