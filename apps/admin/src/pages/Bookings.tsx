import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, humanize, name, rand } from '../lib/format';
import type { BookingBundle, BookingRow, Paged } from '../lib/types';
import { Badge, Card, EmptyState, ErrorBox, Loading, PageHeader, Pagination, Select, Table, statusTone } from '../components/ui';
import { BookingDetailView } from '../components/BookingDetailView';

const STATUSES = ['awaiting_payment', 'funded', 'in_progress', 'completed', 'confirmed', 'disputed', 'cancelled'];

export function BookingsList() {
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['bookings', status, page],
    queryFn: () => api<Paged<'bookings', BookingRow>>('/admin/bookings', { query: { status, page } }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        title="Bookings & payments"
        description="Every hired job and where its money is."
        actions={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="w-48"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </Select>
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      <Card padded={false} className={q.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {q.isLoading ? (
          <Loading />
        ) : q.data?.bookings.length ? (
          <>
            <Table
              rows={q.data.bookings}
              rowKey={(b) => b._id}
              onRowClick={(b) => nav(`/bookings/${b._id}`)}
              columns={[
                { header: 'Job', cell: (b) => <span className="font-medium">{b.title}</span> },
                { header: 'Client', cell: (b) => name(b.client) },
                { header: 'Handyman', cell: (b) => name(b.handyman) },
                { header: 'Amount', cell: (b) => rand(b.amount), className: 'tabular-nums' },
                { header: 'Booking', cell: (b) => <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge> },
                { header: 'Payment', cell: (b) => <Badge tone={statusTone(b.paymentStatus)}>{humanize(b.paymentStatus)}</Badge> },
                { header: 'Updated', cell: (b) => <span className="text-hz-steel">{ago(b.updatedAt)}</span> },
              ]}
            />
            <Pagination page={q.data.page} pages={q.data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={CalendarCheck} title="No bookings" text="Bookings appear when a client accepts a quote." />
        )}
      </Card>
    </>
  );
}

export function BookingDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['booking', id], queryFn: () => api<BookingBundle>(`/admin/bookings/${id}`) });
  return (
    <>
      <Link to="/bookings" className="mb-4 inline-flex items-center gap-1 text-sm text-hz-steel hover:text-hz-charcoal">
        <ArrowLeft className="h-4 w-4" /> Bookings
      </Link>
      <PageHeader title="Booking" />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {q.data ? <BookingDetailView data={q.data} disputeId={q.data.dispute?._id} /> : <Loading />}
    </>
  );
}
