import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShieldCheck, Scale, Flag, ArrowRight, type LucideIcon } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { num, rand } from '../lib/format';
import type { Stats } from '../lib/types';
import { Card, ErrorBox, Loading, PageHeader, Tabs } from '../components/ui';
import { TrendChart } from '../components/TrendChart';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="animate-fade-up">
      <p className="text-sm text-hz-steel">{label}</p>
      <p className="mt-1 font-display text-h2 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-hz-steel">{sub}</p>}
    </Card>
  );
}

function QueueCard({ to, icon: Icon, label, count, empty }: { to: string; icon: LucideIcon; label: string; count: number; empty: string }) {
  return (
    <Link to={to} className="group block animate-fade-up">
      <Card className="flex items-center gap-4 transition-shadow group-hover:shadow-md">
        <span className={`flex h-12 w-12 items-center justify-center rounded-md ${count ? 'bg-hz-sunshine text-hz-charcoal' : 'bg-hz-chalk text-hz-steel'}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-hz-steel">{count ? `${count} waiting` : empty}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-hz-steel transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}

export default function Overview() {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const q = useQuery({ queryKey: ['stats', days], queryFn: () => api<Stats>('/admin/stats', { query: { days } }), placeholderData: keepPreviousData });
  const s = q.data;
  const sum = (k: keyof Stats['series']) => (s ? s.series[k].reduce((n, p) => n + p.value, 0) : 0);

  return (
    <>
      <PageHeader title="Overview" description="How Handzi is doing right now." />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {!s ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-3" aria-label="Queues">
            <QueueCard to="/verifications" icon={ShieldCheck} label="ID verifications" count={s.totals.pendingVerifications} empty="All caught up" />
            <QueueCard to="/disputes" icon={Scale} label="Disputes" count={s.totals.openDisputes} empty="No open disputes" />
            <QueueCard to="/reports" icon={Flag} label="Reports" count={s.totals.openReports} empty="Nothing reported" />
          </section>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Totals">
            <Stat label="Clients" value={num(s.totals.clients)} />
            <Stat label="Handymen" value={num(s.totals.handymen)} sub={`${num(s.totals.publishedHandymen)} with published profiles`} />
            <Stat label="Open jobs" value={num(s.totals.openJobs)} sub={`${num(s.totals.totalJobs)} posted · ${num(s.totals.quotes)} quotes`} />
            <Stat label="Bookings in progress" value={num(s.totals.activeBookings)} sub={`${num(s.totals.completedBookings)} completed`} />
            <Stat label="Payments processed" value={rand(s.totals.gmv)} sub="All time (simulated)" />
            <Stat label="Currently held" value={rand(s.totals.held)} sub="Awaiting confirmation or dispute" />
            <Stat label="Platform fees earned" value={rand(s.totals.commission)} sub="From released payments" />
          </section>

          <section className="space-y-4" aria-label="Trends">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-h2">Trends</h2>
              <Tabs
                value={days}
                onChange={setDays}
                options={[
                  { value: '7', label: '7 days' },
                  { value: '30', label: '30 days' },
                  { value: '90', label: '90 days' },
                ]}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <TrendChart title="New sign-ups" points={s.series.signups} format={num} total={num(sum('signups'))} fetching={q.isFetching} />
              <TrendChart title="Jobs posted" points={s.series.jobs} format={num} total={num(sum('jobs'))} fetching={q.isFetching} />
              <TrendChart title="Payments received" points={s.series.gmv} format={rand} total={rand(sum('gmv'))} fetching={q.isFetching} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
