import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { dateTime, name } from '../lib/format';
import type { AuditEntry, Paged } from '../lib/types';
import { Badge, Card, EmptyState, ErrorBox, Loading, PageHeader, Pagination, Select, Table, type Tone } from '../components/ui';

const tone = (action: string): Tone =>
  /reject|ban|suspend|remove|hide|refund/.test(action) ? 'danger' : /approve|verify|reinstate|restore|resolve/.test(action) ? 'success' : 'neutral';

function describe(e: AuditEntry) {
  const m = e.meta || {};
  const parts = [m.reason, m.title, m.name, m.note, m.text, m.outcome && `outcome: ${m.outcome}`, Array.isArray(m.changed) && m.changed.length ? `changed ${m.changed.join(', ')}` : null]
    .filter(Boolean)
    .map(String);
  if (e.action === 'settings.update' && m.after) parts.push(JSON.stringify(m.after));
  return parts.join(' · ');
}

export default function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['audit', action, page],
    queryFn: () => api<Paged<'entries', AuditEntry>>('/admin/audit', { query: { action, page } }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every action taken in this dashboard, newest first."
        actions={
          <Select value={action} onChange={(e) => (setAction(e.target.value), setPage(1))} className="w-48" aria-label="Filter by action">
            <option value="">All actions</option>
            <option value="verification">Verifications</option>
            <option value="user">Users</option>
            <option value="dispute">Disputes</option>
            <option value="job">Jobs</option>
            <option value="report">Reports</option>
            <option value="message">Messages</option>
            <option value="category">Categories</option>
            <option value="settings">Settings</option>
          </Select>
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      <Card padded={false} className={q.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {q.isLoading ? (
          <Loading />
        ) : q.data?.entries.length ? (
          <>
            <Table
              rows={q.data.entries}
              rowKey={(e) => e._id}
              columns={[
                { header: 'When', cell: (e) => <span className="whitespace-nowrap text-hz-steel">{dateTime(e.createdAt)}</span> },
                { header: 'Admin', cell: (e) => name(e.actor) },
                { header: 'Action', cell: (e) => <Badge tone={tone(e.action)}>{e.action}</Badge> },
                { header: 'Details', cell: (e) => <span className="line-clamp-2 text-hz-steel">{describe(e) || '—'}</span> },
              ]}
            />
            <Pagination page={q.data.page} pages={q.data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={ScrollText} title="No actions yet" text="Approvals, suspensions, dispute decisions and setting changes will be listed here." />
        )}
      </Card>
    </>
  );
}
