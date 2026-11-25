import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Mode } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useBookings } from '@/api/hooks';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/jobMeta';
import { Banner, CardSkeleton, EmptyState, Segmented, space } from '@/ui';
import { BookingCard } from './BookingCard';

/** Active / past bookings for one side. `header` renders above the switch (e.g. earnings). */
export function BookingList({ role, header }: { role: Mode; header?: React.ReactNode }) {
  const q = useBookings(role);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const all = q.data ?? [];
  const active = all.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status));
  const past = all.filter((b) => !ACTIVE_BOOKING_STATUSES.includes(b.status));
  const list = tab === 'active' ? active : past;

  return (
    <>
      {header}
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: role === 'client' ? 'Active' : 'Upcoming', count: active.length },
          { value: 'past', label: 'Past', count: past.length },
        ]}
      />
      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : q.error ? (
        <Banner tone="danger" message={errorMessage(q.error)} />
      ) : list.length ? (
        <View key={tab} style={{ gap: space.md }}>
          {list.map((b, i) => (
            <BookingCard key={b._id} b={b} index={i} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b._id } })} />
          ))}
        </View>
      ) : tab === 'active' ? (
        <EmptyState
          icon="calendar-outline"
          title={role === 'client' ? 'No active bookings' : 'Nothing scheduled'}
          text={role === 'client' ? 'When you accept a quote, you can pay, track and confirm the job here.' : 'Jobs you win will appear here with dates, addresses and payment status.'}
        />
      ) : (
        <EmptyState icon="archive-outline" title="No past bookings" text="Completed and cancelled bookings will show up here." />
      )}
    </>
  );
}

export const useBookingsRefresh = (role: Mode) => {
  const q = useBookings(role);
  return { refreshing: q.isRefetching, onRefresh: q.refetch };
};
