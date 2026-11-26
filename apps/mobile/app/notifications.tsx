import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { notificationApi } from '@/api/endpoints';
import { useNotifications } from '@/api/hooks';
import type { AppNotification } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/format';
import { modeFor, notificationHref } from '@/lib/notificationRoute';
import { Banner, Card, CardSkeleton, EmptyState, ScalePressable, Screen, ScreenHeader, Section, Text, colors, enter, palette, radius, space, useAccent } from '@/ui';

const META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  job_nearby: { icon: 'briefcase', color: palette.orange },
  quote_received: { icon: 'pricetag', color: palette.orange },
  quote_updated: { icon: 'pricetag', color: palette.orange },
  quote_accepted: { icon: 'trophy', color: colors.success },
  quote_rejected: { icon: 'close-circle', color: colors.inkTertiary },
  job_cancelled: { icon: 'ban', color: colors.inkTertiary },
  message: { icon: 'chatbubble-ellipses', color: palette.orange },
  booking_paid: { icon: 'card', color: colors.success },
  job_started: { icon: 'hammer', color: palette.orange },
  job_completed: { icon: 'checkmark-done', color: palette.orange },
  payment_released: { icon: 'cash', color: colors.success },
  booking_cancelled: { icon: 'close-circle', color: colors.inkTertiary },
  dispute_opened: { icon: 'alert-circle', color: colors.danger },
  review_received: { icon: 'star', color: colors.star },
  verification_approved: { icon: 'shield-checkmark', color: colors.success },
  verification_rejected: { icon: 'shield-outline', color: colors.danger },
  dispute_resolved: { icon: 'checkmark-done-circle', color: palette.orange },
  service_booked: { icon: 'calendar', color: palette.orange },
};

function Row({ n, index, onPress }: { n: AppNotification; index: number; onPress: () => void }) {
  const accent = useAccent();
  const meta = META[n.type] ?? { icon: 'notifications', color: accent.main };
  return (
    <Animated.View entering={enter.stagger(index)}>
      <ScalePressable onPress={onPress} scaleTo={0.985} style={[styles.row, !n.read && { backgroundColor: accent.softer }]} accessibilityRole="button" accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body ?? ''}`}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{n.title}</Text>
          {n.body ? (
            <Text variant="body" tone="secondary" numberOfLines={2}>
              {n.body}
            </Text>
          ) : null}
          <Text variant="caption" tone="tertiary">
            {timeAgo(n.createdAt)}
          </Text>
        </View>
        {!n.read && <View style={[styles.dot, { backgroundColor: accent.main }]} />}
      </ScalePressable>
    </Animated.View>
  );
}

export default function Notifications() {
  const { user, switchMode } = useAuth();
  const accent = useAccent();
  const qc = useQueryClient();
  const q = useNotifications();
  const list = q.data?.notifications ?? [];
  const fresh = list.filter((n) => !n.read);
  const earlier = list.filter((n) => n.read);

  const refreshCounts = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const open = async (n: AppNotification) => {
    if (!n.read) notificationApi.markRead([n._id]).then(refreshCounts, () => {});
    const href = notificationHref(n.type, n.data);
    if (!href) return;
    const switchTo = modeFor(n.data, user?.activeMode);
    if (switchTo) {
      await switchMode(switchTo);
      setTimeout(() => router.push(href), 400);
    } else {
      router.push(href);
    }
  };

  const markAll = async () => {
    await notificationApi.markRead().catch(() => {});
    refreshCounts();
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title="Notifications"
          right={
            fresh.length > 0 ? (
              <ScalePressable onPress={markAll} hitSlop={10} accessibilityRole="button">
                <Text variant="label" color={accent.main}>
                  Read all
                </Text>
              </ScalePressable>
            ) : undefined
          }
        />
      }
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
    >
      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : q.error ? (
        <Banner tone="danger" message={errorMessage(q.error)} />
      ) : list.length === 0 ? (
        <EmptyState icon="notifications-outline" title="You're all caught up" text="We'll let you know about new jobs, quotes and messages here." />
      ) : (
        <>
          {fresh.length > 0 && (
            <Section title="New">
              <Card padded={false} style={styles.group}>
                {fresh.map((n, i) => (
                  <Row key={n._id} n={n} index={i} onPress={() => open(n)} />
                ))}
              </Card>
            </Section>
          )}
          {earlier.length > 0 && (
            <Section title="Earlier">
              <Card padded={false} style={styles.group}>
                {earlier.map((n, i) => (
                  <Row key={n._id} n={n} index={i} onPress={() => open(n)} />
                ))}
              </Card>
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
