import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Search, EyeOff, Eye } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, humanize, name } from '../lib/format';
import type { JobRow, Paged } from '../lib/types';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Loading, PageHeader, Pagination, Select, Table, Textarea, statusTone } from '../components/ui';
import { Dialog } from '../components/Dialog';
import { SecureImage } from '../components/SecureImage';
import { useToast } from '../components/Toast';

export default function Jobs() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<JobRow | null>(null);
  const [reason, setReason] = useState('');
  const q = useQuery({
    queryKey: ['jobs', search, status, page],
    queryFn: () => api<Paged<'jobs', JobRow>>('/admin/jobs', { query: { q: search, status, page } }),
    placeholderData: keepPreviousData,
  });
  const removal = useMutation({
    mutationFn: (removed: boolean) => api(`/admin/jobs/${selected!._id}/removal`, { method: 'POST', body: { removed, reason: removed ? reason : undefined } }),
    onSuccess: (_, removed) => {
      toast(removed ? 'Job removed from the marketplace' : 'Job restored');
      setSelected(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e) => toast(errorText(e), 'error'),
  });

  return (
    <>
      <PageHeader title="Jobs" description="Every job posted. Remove anything that isn't a genuine home-repair job." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hz-steel" />
          <Input value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} placeholder="Search job titles" className="pl-9" aria-label="Search jobs" />
        </div>
        <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className="w-44" aria-label="Status">
          <option value="">All statuses</option>
          {['open', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled', 'disputed', 'removed'].map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </Select>
      </div>
      {q.error && <ErrorBox message={errorText(q.error)} />}
      <Card padded={false} className={q.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {q.isLoading ? (
          <Loading />
        ) : q.data?.jobs.length ? (
          <>
            <Table
              rows={q.data.jobs}
              rowKey={(j) => j._id}
              onRowClick={setSelected}
              columns={[
                { header: 'Job', cell: (j) => <span className="font-medium">{j.title}</span> },
                { header: 'Trade', cell: (j) => j.category?.name },
                { header: 'Client', cell: (j) => name(j.client) },
                { header: 'Quotes', cell: (j) => j.quoteCount, className: 'tabular-nums' },
                { header: 'Status', cell: (j) => <Badge tone={statusTone(j.removedByAdmin ? 'removed' : j.status)}>{j.removedByAdmin ? 'Removed' : humanize(j.status)}</Badge> },
                { header: 'Posted', cell: (j) => <span className="text-hz-steel">{ago(j.createdAt)}</span> },
              ]}
            />
            <Pagination page={q.data.page} pages={q.data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={ClipboardList} title="No jobs found" />
        )}
      </Card>
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        wide
        footer={
          selected &&
          (selected.removedByAdmin ? (
            <Button variant="success" icon={Eye} loading={removal.isPending} onClick={() => removal.mutate(false)}>
              Restore job
            </Button>
          ) : (
            <Button variant="danger" icon={EyeOff} loading={removal.isPending} disabled={reason.trim().length < 3} onClick={() => removal.mutate(true)}>
              Remove job
            </Button>
          ))
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{selected.category?.name}</Badge>
              <Badge tone={statusTone(selected.status)}>{humanize(selected.status)}</Badge>
              <span className="text-hz-steel">
                by {name(selected.client)} · {ago(selected.createdAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-hz-charcoal">{selected.description}</p>
            {selected.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.photos.map((p) => (
                  <SecureImage key={p} src={p} alt="Job photo" className="h-24 w-24 rounded-md" />
                ))}
              </div>
            )}
            {selected.removedByAdmin ? (
              <p className="rounded-md border border-hz-danger bg-white px-3 py-2 text-hz-danger">Removed: {selected.removalReason || 'no reason given'}</p>
            ) : (
              <Field label="Reason for removal" hint="Recorded in the audit log. Handymen will no longer see this job.">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Not a home repair job / spam / offensive content" />
              </Field>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
