import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, EyeOff, Check, X } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, humanize, name } from '../lib/format';
import type { ReportRow } from '../lib/types';
import { Badge, Button, Card, EmptyState, ErrorBox, Input, Loading, PageHeader, Tabs, statusTone } from '../components/ui';
import { useToast } from '../components/Toast';

function ReportCard({ r, index }: { r: ReportRow; index: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [note, setNote] = useState('');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['reports'] });
    qc.invalidateQueries({ queryKey: ['queues'] });
  };
  const close = useMutation({
    mutationFn: (status: 'actioned' | 'dismissed') => api(`/admin/reports/${r._id}`, { method: 'POST', body: { status, note: note || undefined } }),
    onSuccess: (_, s) => {
      toast(s === 'actioned' ? 'Marked as actioned' : 'Report dismissed');
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const hideMessage = useMutation({
    mutationFn: () => api(`/admin/messages/${r.targetId}/hidden`, { method: 'POST', body: { hidden: true } }),
    onSuccess: () => {
      toast('Message hidden from both people');
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const open = r.status === 'open';

  return (
    <Card className="space-y-3 animate-fade-up">
      <div style={{ animationDelay: `${index * 40}ms` }} className="flex flex-wrap items-center gap-2">
        <Badge tone="danger" icon={Flag}>
          {humanize(r.targetType)}
        </Badge>
        <span className="text-sm text-hz-steel">
          reported by {name(r.reporter)} · {ago(r.createdAt)}
        </span>
        {!open && <Badge tone={statusTone(r.status)}>{r.status}</Badge>}
      </div>
      <p className="font-medium">“{r.reason}”</p>
      <div className="rounded-md border border-hz-line bg-hz-chalk px-4 py-3 text-sm">
        {r.target ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              {r.target.author && <p className="text-xs text-hz-steel">{r.target.author} wrote:</p>}
              <p className="line-clamp-3">{r.target.label}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.target.status && <Badge tone={statusTone(r.target.status)}>{r.target.status}</Badge>}
              {r.target.link && (
                <Link to={r.target.link} className="text-sm font-medium text-hz-brick hover:underline">
                  Open
                </Link>
              )}
              {r.target.authorId && (
                <Link to={`/users/${r.target.authorId}`} className="text-sm font-medium text-hz-brick hover:underline">
                  View sender
                </Link>
              )}
              {r.targetType === 'message' && r.target.status === 'visible' && (
                <Button size="sm" variant="danger" icon={EyeOff} loading={hideMessage.isPending} onClick={() => hideMessage.mutate()}>
                  Hide message
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-hz-steel">The reported item no longer exists.</p>
        )}
      </div>
      {open ? (
        <div className="flex flex-wrap gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="min-w-[200px] flex-1" />
          <Button icon={X} onClick={() => close.mutate('dismissed')} loading={close.isPending && close.variables === 'dismissed'}>
            Dismiss
          </Button>
          <Button variant="primary" icon={Check} onClick={() => close.mutate('actioned')} loading={close.isPending && close.variables === 'actioned'}>
            Mark actioned
          </Button>
        </div>
      ) : (
        r.note && <p className="text-sm text-hz-steel">Note: {r.note}</p>
      )}
    </Card>
  );
}

export default function Reports() {
  const [status, setStatus] = useState<'open' | 'actioned' | 'dismissed'>('open');
  const q = useQuery({ queryKey: ['reports', status], queryFn: () => api<{ reports: ReportRow[] }>('/admin/reports', { query: { status } }) });
  return (
    <>
      <PageHeader
        title="Reports"
        description="Things users have flagged: people, jobs and messages."
        actions={
          <Tabs
            value={status}
            onChange={setStatus}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'actioned', label: 'Actioned' },
              { value: 'dismissed', label: 'Dismissed' },
            ]}
          />
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {q.isLoading ? (
        <Loading />
      ) : q.data?.reports.length ? (
        <div className="space-y-4">
          {q.data.reports.map((r, i) => (
            <ReportCard key={r._id} r={r} index={i} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Flag} title={status === 'open' ? 'Nothing reported' : `No ${status} reports`} />
        </Card>
      )}
    </>
  );
}
