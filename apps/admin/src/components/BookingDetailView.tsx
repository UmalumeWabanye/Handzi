import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { dateTime, humanize, name, rand } from '../lib/format';
import type { BookingBundle } from '../lib/types';
import { Badge, Button, Card, Field, Input, Textarea, statusTone } from './ui';
import { Dialog } from './Dialog';
import { SecureImage } from './SecureImage';
import { useToast } from './Toast';

function Party({ role, p }: { role: string; p: { _id: string; firstName: string; lastName: string; phone?: string; email?: string } }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-hz-steel">{role}</p>
      <Link to={`/users/${p._id}`} className="font-semibold text-hz-brick hover:underline">
        {name(p)}
      </Link>
      <p className="text-sm text-hz-steel">{[p.phone, p.email].filter(Boolean).join(' · ')}</p>
    </div>
  );
}

/** Everything about one booking: parties, money trail, dispute (with resolve tools) and their chat. */
export function BookingDetailView({ data, disputeId }: { data: BookingBundle; disputeId?: string }) {
  const { booking: b, payment, dispute, messages } = data;
  const qc = useQueryClient();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState<null | 'release' | 'refund' | 'split'>(null);
  const [refund, setRefund] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['dispute'] });
    qc.invalidateQueries({ queryKey: ['disputes'] });
    qc.invalidateQueries({ queryKey: ['booking'] });
    qc.invalidateQueries({ queryKey: ['queues'] });
  };
  const addNote = useMutation({
    mutationFn: () => api(`/admin/disputes/${disputeId}/notes`, { method: 'POST', body: { text: note } }),
    onSuccess: () => {
      setNote('');
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const resolve = useMutation({
    mutationFn: () =>
      api(`/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: { outcome: resolving, refundAmount: resolving === 'split' ? Number(refund) : undefined, note: resolutionNote || undefined },
      }),
    onSuccess: () => {
      toast('Dispute resolved · both parties notified');
      setResolving(null);
      refresh();
    },
    onError: (e) => toast(errorText(e), 'error'),
  });

  const open = dispute && dispute.status !== 'resolved';
  const pct = b.amount ? b.commissionAmount / b.amount : 0.1;
  const splitRefund = Number(refund) || 0;
  const splitHandyman = Math.max(0, (b.amount - splitRefund) * (1 - pct));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card className="space-y-4 animate-fade-up">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-h2">{b.title}</h2>
              <p className="text-sm text-hz-steel">{[b.location?.address, b.location?.suburb, b.location?.city].filter(Boolean).join(', ')}</p>
            </div>
            <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge>
          </div>
          {b.job?.description && <p className="text-sm text-hz-steel">{b.job.description}</p>}
          {b.job?.photos?.length ? (
            <div className="flex flex-wrap gap-2">
              {b.job.photos.map((p) => (
                <SecureImage key={p} src={p} alt="Job photo" className="h-20 w-20 rounded-md" />
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 border-t border-hz-line pt-4 sm:grid-cols-2">
            <Party role="Client" p={b.client} />
            <Party role="Handyman" p={b.handyman} />
          </div>
        </Card>

        {dispute && (
          <Card className="space-y-4 border-hz-danger animate-fade-up">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-hz-danger" />
              <h2 className="font-semibold">Dispute</h2>
              <Badge tone={statusTone(dispute.status)}>{humanize(dispute.status)}</Badge>
            </div>
            <blockquote className="rounded-md border-l-4 border-hz-danger bg-hz-chalk px-4 py-3 text-small text-hz-charcoal">“{dispute.reason}”</blockquote>
            <p className="text-xs text-hz-steel">Opened {dateTime(dispute.createdAt)}</p>
            {dispute.resolution?.outcome && (
              <p className="text-sm">
                Resolved as <strong>{dispute.resolution.outcome}</strong>
                {dispute.resolution.refundAmount ? ` · ${rand(dispute.resolution.refundAmount)} refunded` : ''}
                {dispute.resolution.note ? ` · ${dispute.resolution.note}` : ''}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Admin notes</p>
              {dispute.adminNotes.length ? (
                dispute.adminNotes.map((n, i) => (
                  <div key={i} className="rounded-md border border-hz-line px-3 py-2 text-sm">
                    <p>{n.text}</p>
                    <p className="mt-1 text-xs text-hz-steel">
                      {name(n.by)} · {dateTime(n.at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-hz-steel">No notes yet.</p>
              )}
              {open && (
                <div className="flex gap-2">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (only admins see this)" onKeyDown={(e) => e.key === 'Enter' && note.trim() && addNote.mutate()} />
                  <Button onClick={() => addNote.mutate()} disabled={!note.trim()} loading={addNote.isPending}>
                    Add
                  </Button>
                </div>
              )}
            </div>
            {open && (
              <div className="flex flex-wrap gap-2 border-t border-hz-line pt-4">
                <Button variant="success" onClick={() => setResolving('release')}>
                  Release to handyman
                </Button>
                <Button onClick={() => setResolving('split')}>Split</Button>
                <Button variant="danger" onClick={() => setResolving('refund')}>
                  Refund client
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card className="animate-fade-up" padded={false}>
          <div className="flex items-center gap-2 border-b border-hz-line px-5 py-4">
            <MessageSquare className="h-4 w-4 text-hz-steel" />
            <h2 className="font-semibold">Conversation</h2>
            <span className="text-sm text-hz-steel">{messages.length} messages</span>
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto px-5 py-4">
            {messages.length ? (
              messages.map((m) => {
                const fromClient = m.sender === b.client._id;
                return (
                  <div key={m._id} className={`flex ${fromClient ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-small ${fromClient ? 'bg-hz-chalk text-hz-charcoal' : 'bg-hz-charcoal text-white'} ${m.hidden ? 'opacity-50 line-through' : ''}`}>
                      <p className={`text-caption font-semibold ${fromClient ? 'text-hz-steel' : 'text-hz-mist'}`}>{fromClient ? b.client.firstName : b.handyman.firstName}</p>
                      {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                      {m.images.map((u) => (
                        <SecureImage key={u} src={u} alt="Chat photo" className="mt-1 h-32 w-32 rounded-md" />
                      ))}
                      <p className={`mt-1 text-caption ${fromClient ? 'text-hz-steel' : 'text-hz-mist'}`}>
                        {dateTime(m.createdAt)}
                        {m.containsContact ? ' · shared contact details' : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-hz-steel">They haven't messaged each other about this job.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-3 animate-fade-up">
          <h2 className="font-semibold">Money</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-hz-steel">Client paid</dt>
              <dd className="font-semibold tabular-nums">{rand(b.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-hz-steel">Platform fee</dt>
              <dd className="tabular-nums">{rand(b.commissionAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-hz-steel">Handyman payout</dt>
              <dd className="tabular-nums">{rand(b.handymanPayout)}</dd>
            </div>
            {payment?.refundAmount ? (
              <div className="flex justify-between">
                <dt className="text-hz-steel">Refunded</dt>
                <dd className="tabular-nums">{rand(payment.refundAmount)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(payment?.status)}>{payment ? humanize(payment.status) : 'Not paid'}</Badge>
            {payment?.paystackReference && <span className="truncate text-xs text-hz-steel">{payment.paystackReference}</span>}
          </div>
        </Card>
        {payment && (
          <Card className="animate-fade-up">
            <h2 className="mb-3 font-semibold">Payment history</h2>
            <ol className="space-y-3 border-l-2 border-hz-line pl-4">
              {payment.history.map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-hz-orange" />
                  <p className="font-medium">{humanize(h.status)}</p>
                  {h.note && <p className="text-hz-steel">{h.note}</p>}
                  <p className="text-xs text-hz-steel">{dateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <Dialog
        open={!!resolving}
        onClose={() => setResolving(null)}
        title={resolving === 'release' ? 'Release payment to handyman' : resolving === 'refund' ? 'Refund the client in full' : 'Split the payment'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolving(null)}>
              Cancel
            </Button>
            <Button
              variant={resolving === 'refund' ? 'danger' : 'primary'}
              loading={resolve.isPending}
              disabled={resolving === 'split' && !(splitRefund > 0 && splitRefund < b.amount)}
              onClick={() => resolve.mutate()}
            >
              Resolve dispute
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          {resolving === 'release' && (
            <p>
              {b.handyman.firstName} receives {rand(b.handymanPayout)} as normal and the booking is marked complete.
            </p>
          )}
          {resolving === 'refund' && <p>{b.client.firstName} gets the full {rand(b.amount)} back and the booking is cancelled.</p>}
          {resolving === 'split' && (
            <>
              <Field label="Refund to client (R)" hint={`Between R1 and ${rand(b.amount - 1)}`}>
                <Input type="number" min={1} max={b.amount - 1} value={refund} onChange={(e) => setRefund(e.target.value)} autoFocus />
              </Field>
              <p className="rounded-md bg-hz-chalk px-3 py-2">
                Client gets <strong>{rand(splitRefund)}</strong> back · handyman receives <strong>{rand(splitHandyman)}</strong> (after the platform fee).
              </p>
            </>
          )}
          <Field label="Note to both parties" hint="Optional. Included in the notification they receive.">
            <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
