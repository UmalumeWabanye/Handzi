import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Scale } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, humanize, name, rand } from '../lib/format';
import type { BookingBundle, BookingRow, DisputeDoc } from '../lib/types';
import { Badge, Card, EmptyState, ErrorBox, Loading, PageHeader, Table, Tabs, statusTone } from '../components/ui';
import { BookingDetailView } from '../components/BookingDetailView';

export function DisputesList() {
  const nav = useNavigate();
  const [status, setStatus] = useState<'open' | 'resolved'>('open');
  const q = useQuery({ queryKey: ['disputes', status], queryFn: () => api<{ disputes: DisputeDoc[] }>('/admin/disputes', { query: { status } }) });
  return (
    <>
      <PageHeader
        title="Disputes"
        description="Payouts are frozen until you resolve these. Oldest first."
        actions={
          <Tabs
            value={status}
            onChange={setStatus}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      <Card padded={false}>
        {q.isLoading ? (
          <Loading />
        ) : q.data?.disputes.length ? (
          <Table
            rows={q.data.disputes}
            rowKey={(d) => d._id}
            onRowClick={(d) => nav(`/disputes/${d._id}`)}
            columns={[
              {
                header: 'Booking',
                cell: (d) => {
                  const b = d.booking as BookingRow;
                  return (
                    <div>
                      <p className="font-medium">{b?.title}</p>
                      <p className="line-clamp-1 text-xs text-hz-steel">“{d.reason}”</p>
                    </div>
                  );
                },
              },
              { header: 'Client', cell: (d) => name((d.booking as BookingRow)?.client) },
              { header: 'Handyman', cell: (d) => name((d.booking as BookingRow)?.handyman) },
              { header: 'Amount', cell: (d) => rand((d.booking as BookingRow)?.amount), className: 'tabular-nums' },
              { header: 'Status', cell: (d) => <Badge tone={statusTone(d.status)}>{humanize(d.status)}</Badge> },
              { header: 'Opened', cell: (d) => <span className="text-hz-steel">{ago(d.createdAt)}</span> },
            ]}
          />
        ) : (
          <EmptyState icon={Scale} title={status === 'open' ? 'No open disputes' : 'No resolved disputes yet'} />
        )}
      </Card>
    </>
  );
}

export function DisputeDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['dispute', id], queryFn: () => api<BookingBundle>(`/admin/disputes/${id}`) });
  return (
    <>
      <Link to="/disputes" className="mb-4 inline-flex items-center gap-1 text-sm text-hz-steel hover:text-hz-charcoal">
        <ArrowLeft className="h-4 w-4" /> Disputes
      </Link>
      <PageHeader title="Dispute" />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {q.data ? <BookingDetailView data={q.data} disputeId={id} /> : <Loading />}
    </>
  );
}
