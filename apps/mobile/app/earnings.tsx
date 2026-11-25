import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useEarnings } from '@/api/hooks';
import { dayLabel, rand } from '@/lib/format';
import { PAYMENT_META } from '@/lib/jobMeta';
import { Badge, Banner, Card, EmptyState, Screen, ScreenHeader, Section, Skeleton, Text, enter, space, useAccent } from '@/ui';

export default function EarningsScreen() {
  const accent = useAccent();
  const q = useEarnings();
  const d = q.data;
  return (
    <Screen edges={['top', 'bottom']} header={<ScreenHeader title="Earnings" />} refreshing={q.isRefetching} onRefresh={q.refetch}>
      {q.isLoading ? (
        <Skeleton height={160} />
      ) : q.error || !d ? (
        <Banner tone="danger" message={q.error ? errorMessage(q.error) : 'Something went wrong'} />
      ) : (
        <>
          <Animated.View entering={enter.up()}>
            <Card style={{ backgroundColor: accent.main, borderColor: accent.main, gap: space.xs }}>
              <Text variant="label" color="rgba(255,255,255,0.85)">
                Paid out
              </Text>
              <Text variant="display" color="#fff">
                {rand(d.totals.released)}
              </Text>
              <Text variant="caption" color="rgba(255,255,255,0.85)">
                from {d.totals.jobs} completed job{d.totals.jobs === 1 ? '' : 's'}
              </Text>
            </Card>
          </Animated.View>
          <View style={styles.row}>
            <Card style={styles.stat}>
              <Text variant="caption" tone="tertiary">
                Held for active jobs
              </Text>
              <Text variant="heading">{rand(d.totals.held)}</Text>
            </Card>
            <Card style={styles.stat}>
              <Text variant="caption" tone="tertiary">
                On hold (disputes)
              </Text>
              <Text variant="heading">{rand(d.totals.disputed)}</Text>
            </Card>
          </View>
          {d.provider === 'mock' && <Banner tone="info" message="Payments are simulated in this version of Handzi. No real money is transferred." icon="flask-outline" />}
          <Section title="History">
            {d.payments.length ? (
              <View style={{ gap: space.sm }}>
                {d.payments.map((p, i) => {
                  const meta = PAYMENT_META[p.status];
                  const when = p.releasedAt || p.refundedAt || p.heldAt;
                  return (
                    <Animated.View key={p._id} entering={enter.stagger(i)}>
                      <Card onPress={() => router.push({ pathname: '/booking/[id]', params: { id: p.bookingId } })} style={{ gap: space.sm }} accessibilityLabel={`${p.title}, ${rand(p.payoutAmount)}, ${meta.label}`}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
                          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                            {p.title}
                          </Text>
                          <Text variant="bodyStrong">{rand(p.payoutAmount)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge label={meta.label.replace(' by Handzi', '').replace(' to handyman', '')} tone={meta.tone} icon={meta.icon} />
                          {when && (
                            <Text variant="caption" tone="tertiary">
                              {dayLabel(when)}
                            </Text>
                          )}
                        </View>
                      </Card>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <EmptyState compact icon="wallet-outline" title="No earnings yet" text="When a client pays for a job, it shows up here." />
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: space.md }, stat: { flex: 1, gap: 2 } });
