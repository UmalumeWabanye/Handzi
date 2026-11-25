import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, BadgeCheck } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, date, name } from '../lib/format';
import type { Verification } from '../lib/types';
import { Avatar, Badge, Button, Card, EmptyState, ErrorBox, Field, Loading, PageHeader, Tabs, Textarea, statusTone } from '../components/ui';
import { Dialog } from '../components/Dialog';
import { SecureImage } from '../components/SecureImage';
import { useToast } from '../components/Toast';

const REASONS = ['ID photo is blurry or cut off', "Selfie doesn't match the ID photo", 'ID document has expired', 'Not a valid identity document'];

function Item({ v, index }: { v: Verification; index: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['verifications'] });
    qc.invalidateQueries({ queryKey: ['queues'] });
  };
  const approve = useMutation({
    mutationFn: () => api(`/admin/verifications/${v.userId}/approve`, { method: 'POST' }),
    onSuccess: () => {
      toast(`${v.user.firstName} is verified`);
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const reject = useMutation({
    mutationFn: () => api(`/admin/verifications/${v.userId}/reject`, { method: 'POST', body: { reason } }),
    onSuccess: () => {
      toast(`Rejected · ${v.user.firstName} has been told why`);
      setRejecting(false);
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const certify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => api(`/admin/handymen/${v.userId}/certifications/${id}/verify`, { method: 'POST', body: { verified } }),
    onSuccess: refresh,
    onError: (e) => toast(errorText(e), 'error'),
  });
  const pending = v.verification.status === 'pending';

  return (
    <Card className="animate-fade-up" padded={false}>
      <div style={{ animationDelay: `${index * 40}ms` }} className="grid gap-6 p-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={v.user.avatar} name={name(v.user)} size={44} />
            <div className="min-w-0">
              <p className="font-semibold">{name(v.user)}</p>
              <p className="truncate text-sm text-hz-steel">{v.headline || 'No headline'}</p>
            </div>
            <Badge tone={statusTone(v.verification.status)}>{v.verification.status}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-hz-steel">Phone</dt>
              <dd className="font-medium">{v.user.phone}</dd>
            </div>
            <div>
              <dt className="text-hz-steel">Trades</dt>
              <dd className="font-medium">{v.trades.map((t) => t.name).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-hz-steel">Area</dt>
              <dd className="font-medium">{[v.place?.suburb, v.place?.city].filter(Boolean).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-hz-steel">Experience</dt>
              <dd className="font-medium">{v.yearsExperience} yrs</dd>
            </div>
            <div>
              <dt className="text-hz-steel">Joined</dt>
              <dd className="font-medium">{date(v.user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-hz-steel">Submitted</dt>
              <dd className="font-medium">{ago(v.verification.submittedAt)}</dd>
            </div>
          </dl>
          {v.verification.rejectionReason && <p className="text-sm text-hz-danger">Rejected: {v.verification.rejectionReason}</p>}
          {v.certifications.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Certifications</p>
              {v.certifications.map((c) => (
                <div key={c._id} className="flex flex-wrap items-center gap-3 rounded-md border border-hz-line p-2 pr-3">
                  <SecureImage src={c.documentUrl} alt={`${c.name} certificate`} className="h-12 w-16 rounded-md" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-hz-steel">{[c.issuer, c.number && `#${c.number}`].filter(Boolean).join(' · ') || 'No details'}</p>
                  </div>
                  <Button size="sm" variant={c.verified ? 'ghost' : 'secondary'} icon={c.verified ? X : BadgeCheck} onClick={() => certify.mutate({ id: c._id, verified: !c.verified })}>
                    {c.verified ? 'Unverify' : 'Verify'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <figure className="space-y-1">
              <SecureImage src={v.verification.idDocumentUrl} alt={`${name(v.user)} ID document`} className="h-40 w-full rounded-md sm:w-56" />
              <figcaption className="text-xs text-hz-steel">ID document</figcaption>
            </figure>
            <figure className="space-y-1">
              <SecureImage src={v.verification.selfieUrl} alt={`${name(v.user)} selfie`} className="h-40 w-full rounded-md sm:w-56" />
              <figcaption className="text-xs text-hz-steel">Selfie</figcaption>
            </figure>
          </div>
          {pending && (
            <div className="flex gap-2">
              <Button variant="danger" icon={X} className="flex-1" onClick={() => setRejecting(true)}>
                Reject
              </Button>
              <Button variant="success" icon={Check} className="flex-1" loading={approve.isPending} onClick={() => approve.mutate()}>
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={`Reject ${v.user.firstName}'s verification`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={reject.isPending} disabled={reason.trim().length < 5} onClick={() => reject.mutate()}>
              Reject
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-hz-steel">The handyman sees this reason in the app and can upload new documents.</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${reason === r ? 'border-hz-charcoal bg-hz-charcoal text-white' : 'border-hz-line hover:bg-hz-chalk'}`}>
                {r}
              </button>
            ))}
          </div>
          <Field label="Reason">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs fixing" />
          </Field>
        </div>
      </Dialog>
    </Card>
  );
}

export default function Verifications() {
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const q = useQuery({ queryKey: ['verifications', status], queryFn: () => api<{ items: Verification[] }>('/admin/verifications', { query: { status } }) });
  return (
    <>
      <PageHeader
        title="ID verifications"
        description="Check each handyman's ID against their selfie. Approved handymen can send quotes."
        actions={
          <Tabs
            value={status}
            onChange={setStatus}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'verified', label: 'Verified' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items.length ? (
        <div className="space-y-4">
          {q.data.items.map((v, i) => (
            <Item key={v.userId} v={v} index={i} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={ShieldCheck} title={status === 'pending' ? 'No one waiting' : `No ${status} handymen`} text={status === 'pending' ? 'New ID submissions will appear here, oldest first.' : undefined} />
        </Card>
      )}
    </>
  );
}
