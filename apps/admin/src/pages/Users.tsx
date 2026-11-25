import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Users as UsersIcon, Ban, PauseCircle, PlayCircle, Star } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { ago, date, humanize, name, rand } from '../lib/format';
import type { Paged, UserRow } from '../lib/types';
import { Avatar, Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Loading, PageHeader, Pagination, Select, Table, Textarea, statusTone } from '../components/ui';
import { Dialog } from '../components/Dialog';
import { useToast } from '../components/Toast';

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function UsersList() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const query = useQuery({
    queryKey: ['users', q, role, status, page],
    queryFn: () => api<Paged<'users', UserRow>>('/admin/users', { query: { q, role, status, page } }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Users" description="Search everyone on Handzi. Suspend or ban accounts that break the rules." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hz-steel" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name, email or phone"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select value={role} onChange={(e) => (setRole(e.target.value), setPage(1))} className="w-40" aria-label="Role">
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="handyman">Handymen</option>
          <option value="admin">Admins</option>
        </Select>
        <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className="w-40" aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </Select>
      </div>
      {query.error && <ErrorBox message={errorText(query.error)} />}
      <Card padded={false} className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {query.isLoading ? (
          <Loading />
        ) : query.data?.users.length ? (
          <>
            <Table
              rows={query.data.users}
              rowKey={(u) => u._id}
              onRowClick={(u) => nav(`/users/${u._id}`)}
              columns={[
                {
                  header: 'User',
                  cell: (u) => (
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={name(u)} />
                      <div className="min-w-0">
                        <p className="font-medium">{name(u)}</p>
                        <p className="truncate text-xs text-hz-steel">{u.email || u.phone}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Roles',
                  cell: (u) => (
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} tone={r === 'handyman' ? 'handy' : r === 'admin' ? 'neutral' : 'brand'}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                { header: 'Status', cell: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge> },
                { header: 'Joined', cell: (u) => <span className="text-hz-steel">{date(u.createdAt)}</span> },
                { header: 'Last login', cell: (u) => <span className="text-hz-steel">{ago(u.lastLoginAt)}</span> },
              ]}
            />
            <Pagination page={query.data.page} pages={query.data.pages} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={UsersIcon} title="No users found" text="Try a different search or filter." />
        )}
      </Card>
    </>
  );
}

type UserDetailData = {
  user: UserRow & { statusReason?: string };
  profile: null | { headline?: string; verification: { status: string }; trades: { name: string }[]; stats: { averageRating: number; reviewCount: number; jobsCompleted: number } };
  jobs: { _id: string; title: string; status: string; createdAt: string; quoteCount: number; removedByAdmin?: boolean }[];
  bookings: { _id: string; title: string; status: string; amount: number; createdAt: string }[];
  reportsAgainst: { _id: string; reason: string; createdAt: string; reporter: { firstName: string; lastName: string } }[];
  reviews: { _id: string; rating: number; text?: string; reviewer: { firstName: string } }[];
};

export function UserDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['user', id], queryFn: () => api<UserDetailData>(`/admin/users/${id}`) });
  const [action, setAction] = useState<null | 'suspended' | 'banned' | 'active'>(null);
  const [reason, setReason] = useState('');
  const setStatus = useMutation({
    mutationFn: () => api(`/admin/users/${id}/status`, { method: 'POST', body: { status: action, reason: reason || undefined } }),
    onSuccess: () => {
      toast(action === 'active' ? 'Account reinstated' : `Account ${action}`);
      setAction(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast(errorText(e), 'error'),
  });

  const d = q.data;
  return (
    <>
      <Link to="/users" className="mb-4 inline-flex items-center gap-1 text-sm text-hz-steel hover:text-hz-charcoal">
        <ArrowLeft className="h-4 w-4" /> Users
      </Link>
      {q.error && <ErrorBox message={errorText(q.error)} />}
      {!d ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-4 animate-fade-up">
            <Avatar src={d.user.avatar} name={name(d.user)} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-h2">{name(d.user)}</h1>
                <Badge tone={statusTone(d.user.status)}>{d.user.status}</Badge>
                {d.user.roles.map((r) => (
                  <Badge key={r} tone={r === 'handyman' ? 'handy' : 'brand'}>
                    {r}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-hz-steel">
                {[d.user.phone, d.user.email].filter(Boolean).join(' · ')} · joined {date(d.user.createdAt)}
              </p>
              {d.user.statusReason && d.user.status !== 'active' && <p className="mt-1 text-sm text-hz-danger">Reason: {d.user.statusReason}</p>}
            </div>
            {!d.user.roles.includes('admin') && (
              <div className="flex gap-2">
                {d.user.status === 'active' ? (
                  <>
                    <Button icon={PauseCircle} onClick={() => setAction('suspended')}>
                      Suspend
                    </Button>
                    <Button variant="danger" icon={Ban} onClick={() => setAction('banned')}>
                      Ban
                    </Button>
                  </>
                ) : (
                  <Button variant="success" icon={PlayCircle} onClick={() => setAction('active')}>
                    Reinstate
                  </Button>
                )}
              </div>
            )}
          </Card>

          {d.profile && (
            <Card className="grid gap-4 sm:grid-cols-4 animate-fade-up">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-hz-steel">Handyman profile</p>
                <p className="font-medium">{d.profile.headline || '—'}</p>
                <p className="text-sm text-hz-steel">{d.profile.trades.map((t) => t.name).join(', ')}</p>
              </div>
              <div>
                <p className="text-xs text-hz-steel">Verification</p>
                <Badge tone={statusTone(d.profile.verification.status)}>{d.profile.verification.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-hz-steel">Rating · jobs</p>
                <p className="flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 fill-hz-sunshine text-hz-sunshine-dark" />
                  {d.profile.stats.reviewCount ? d.profile.stats.averageRating.toFixed(1) : '—'} · {d.profile.stats.jobsCompleted} done
                </p>
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padded={false}>
              <h2 className="border-b border-hz-line px-5 py-4 font-semibold">Jobs posted</h2>
              {d.jobs.length ? (
                <ul className="divide-y divide-hz-line">
                  {d.jobs.map((j) => (
                    <li key={j._id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span className="truncate">{j.title}</span>
                      <Badge tone={statusTone(j.removedByAdmin ? 'removed' : j.status)}>{j.removedByAdmin ? 'removed' : humanize(j.status)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-hz-steel">None</p>
              )}
            </Card>
            <Card padded={false}>
              <h2 className="border-b border-hz-line px-5 py-4 font-semibold">Bookings</h2>
              {d.bookings.length ? (
                <ul className="divide-y divide-hz-line">
                  {d.bookings.map((b) => (
                    <li key={b._id}>
                      <Link to={`/bookings/${b._id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-hz-chalk">
                        <span className="truncate">{b.title}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums text-hz-steel">{rand(b.amount)}</span>
                          <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-hz-steel">None</p>
              )}
            </Card>
            <Card padded={false}>
              <h2 className="border-b border-hz-line px-5 py-4 font-semibold">Reports about this user</h2>
              {d.reportsAgainst.length ? (
                <ul className="divide-y divide-hz-line">
                  {d.reportsAgainst.map((r) => (
                    <li key={r._id} className="px-5 py-3 text-sm">
                      <p>{r.reason}</p>
                      <p className="text-xs text-hz-steel">
                        by {name(r.reporter)} · {ago(r.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-hz-steel">None</p>
              )}
            </Card>
            <Card padded={false}>
              <h2 className="border-b border-hz-line px-5 py-4 font-semibold">Reviews received</h2>
              {d.reviews.length ? (
                <ul className="divide-y divide-hz-line">
                  {d.reviews.map((r) => (
                    <li key={r._id} className="px-5 py-3 text-sm">
                      <p className="flex items-center gap-1 font-medium" aria-label={`${r.rating} out of 5 stars from ${r.reviewer?.firstName}`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'fill-hz-sunshine text-hz-sunshine-dark' : 'text-hz-line'}`} />
                        ))}
                        <span className="ml-1 font-normal text-hz-steel">from {r.reviewer?.firstName}</span>
                      </p>
                      {r.text && <p className="text-hz-steel">{r.text}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-hz-steel">None</p>
              )}
            </Card>
          </div>
        </div>
      )}
      <Dialog
        open={!!action}
        onClose={() => setAction(null)}
        title={action === 'active' ? 'Reinstate account' : action === 'banned' ? 'Ban account' : 'Suspend account'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button variant={action === 'active' ? 'success' : 'danger'} loading={setStatus.isPending} onClick={() => setStatus.mutate()}>
              {action === 'active' ? 'Reinstate' : action === 'banned' ? 'Ban' : 'Suspend'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-hz-steel">
            {action === 'active'
              ? 'They will be able to sign in and use Handzi again.'
              : 'They will be signed out on every device immediately and blocked from the app until reinstated.'}
          </p>
          {action !== 'active' && (
            <Field label="Reason" hint="Recorded in the audit log.">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
        </div>
      </Dialog>
    </>
  );
}
