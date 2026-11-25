import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText } from '../lib/api';
import { rand } from '../lib/format';
import type { Settings as S } from '../lib/types';
import { Button, Card, ErrorBox, Field, Input, Loading, PageHeader } from '../components/ui';
import { useToast } from '../components/Toast';

export default function Settings() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<{ settings: S }>('/admin/settings') });
  const [commission, setCommission] = useState('');
  const [hours, setHours] = useState('');
  useEffect(() => {
    if (q.data) {
      setCommission(String(q.data.settings.commissionPercent));
      setHours(String(q.data.settings.autoConfirmHours));
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => api('/admin/settings', { method: 'PATCH', body: { commissionPercent: Number(commission), autoConfirmHours: Number(hours) } }),
    onSuccess: () => {
      toast('Settings saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast(errorText(e), 'error'),
  });

  const c = Number(commission);
  const valid = c >= 0 && c <= 50 && Number(hours) >= 1 && Number(hours) <= 720;
  const dirty = q.data && (c !== q.data.settings.commissionPercent || Number(hours) !== q.data.settings.autoConfirmHours);

  return (
    <>
      <PageHeader title="Settings" description="Platform-wide rules. Changes apply to new bookings and are recorded in the audit log." />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {!q.data ? (
        <Loading />
      ) : (
        <Card className="max-w-xl space-y-6 animate-fade-up">
          <Field label="Platform fee (%)" hint={valid ? `On a ${rand(2000)} job the handyman receives ${rand(2000 * (1 - c / 100))}.` : 'Between 0 and 50.'}>
            <Input type="number" min={0} max={50} step={0.5} value={commission} onChange={(e) => setCommission(e.target.value)} />
          </Field>
          <Field label="Auto-confirm after (hours)" hint="If the client neither confirms nor reports a problem after the handyman marks a job done, payment is released after this long.">
            <Input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" disabled={!valid || !dirty} loading={save.isPending} onClick={() => save.mutate()}>
              Save changes
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
