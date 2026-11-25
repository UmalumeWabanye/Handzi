import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEarnings } from '@/api/hooks';
import { BookingList, useBookingsRefresh } from '@/features/bookings/BookingList';
import { TabPage } from '@/features/shared/TabPage';
import { rand } from '@/lib/format';
import { Card, Text, space, useAccent } from '@/ui';

function EarningsSummary() {
  const accent = useAccent();
  const { data } = useEarnings();
  return (
    <Card onPress={() => router.push('/earnings')} style={{ backgroundColor: accent.main, borderColor: accent.main, gap: space.sm }} accessibilityLabel="Earnings">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color="rgba(255,255,255,0.85)">
          Earnings
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
      <Text variant="display" color="#fff">
        {rand(data?.totals.released ?? 0)}
      </Text>
      <Text variant="caption" color="rgba(255,255,255,0.85)">
        {rand(data?.totals.held ?? 0)} held for jobs in progress
      </Text>
    </Card>
  );
}

export default function Schedule() {
  const refresh = useBookingsRefresh('handyman');
  const earnings = useEarnings();
  return (
    <TabPage
      title="Schedule"
      refreshing={refresh.refreshing}
      onRefresh={() => {
        refresh.onRefresh();
        earnings.refetch();
      }}
    >
      <BookingList role="handyman" header={<EarningsSummary />} />
    </TabPage>
  );
}
