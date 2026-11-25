import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags } from 'lucide-react';
import { api, errorText } from '../lib/api';
import type { Category } from '../lib/types';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Loading, PageHeader, Table } from '../components/ui';
import { Dialog } from '../components/Dialog';
import { useToast } from '../components/Toast';

type Draft = { _id?: string; name: string; icon: string; subcategories: string; active: boolean; sortOrder: number };
const empty: Draft = { name: '', icon: 'construct-outline', subcategories: '', active: true, sortOrder: 0 };

export default function Categories() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/admin/categories') });
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: (d: Draft) => {
      const body = { name: d.name.trim(), icon: d.icon.trim(), subcategories: d.subcategories.split(',').map((s) => s.trim()).filter(Boolean), active: d.active, sortOrder: Number(d.sortOrder) || 0 };
      return d._id ? api(`/admin/categories/${d._id}`, { method: 'PATCH', body }) : api('/admin/categories', { method: 'POST', body });
    },
    onSuccess: () => {
      toast(draft?._id ? 'Category updated' : 'Category added');
      setDraft(null);
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast(errorText(e), 'error'),
  });
  const toggle = useMutation({
    mutationFn: (c: Category) => api(`/admin/categories/${c._id}`, { method: 'PATCH', body: { active: !c.active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    onError: (e) => toast(errorText(e), 'error'),
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="The trades clients can hire for. Hidden categories disappear from the app but keep their existing jobs."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setDraft({ ...empty, sortOrder: q.data?.categories.length ?? 0 })}>
            Add category
          </Button>
        }
      />
      {q.error && <ErrorBox message={errorText(q.error)} />}
      <Card padded={false}>
        {q.isLoading ? (
          <Loading />
        ) : q.data?.categories.length ? (
          <Table
            rows={q.data.categories}
            rowKey={(c) => c._id}
            onRowClick={(c) => setDraft({ _id: c._id, name: c.name, icon: c.icon, subcategories: c.subcategories.join(', '), active: c.active, sortOrder: c.sortOrder })}
            columns={[
              { header: '#', cell: (c) => <span className="text-hz-steel tabular-nums">{c.sortOrder}</span>, className: 'w-12' },
              { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
              { header: 'Sub-categories', cell: (c) => <span className="line-clamp-1 text-hz-steel">{c.subcategories.join(', ')}</span> },
              { header: 'Icon', cell: (c) => <code className="text-xs text-hz-steel">{c.icon}</code> },
              {
                header: 'Visible',
                cell: (c) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle.mutate(c);
                    }}
                    role="switch"
                    aria-checked={c.active}
                    aria-label={`${c.name} visible`}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${c.active ? 'bg-hz-brick' : 'bg-hz-mist'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${c.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                ),
              },
              { header: '', cell: (c) => !c.active && <Badge>Hidden</Badge> },
            ]}
          />
        ) : (
          <EmptyState icon={Tags} title="No categories" text="Run the seed script or add one." />
        )}
      </Card>
      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?._id ? 'Edit category' : 'Add category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={save.isPending} disabled={!draft || draft.name.trim().length < 2} onClick={() => draft && save.mutate(draft)}>
              Save
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Name">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Sub-categories" hint="Comma-separated. Shown as quick picks when posting a job and as skill suggestions.">
              <Input value={draft.subcategories} onChange={(e) => setDraft({ ...draft, subcategories: e.target.value })} placeholder="Leaks, Geysers, Drains" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Icon" hint="An Ionicons name, e.g. water-outline">
                <Input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
              </Field>
              <Field label="Sort order">
                <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4 accent-hz-brick" />
              Visible in the app
            </label>
          </div>
        )}
      </Dialog>
    </>
  );
}
