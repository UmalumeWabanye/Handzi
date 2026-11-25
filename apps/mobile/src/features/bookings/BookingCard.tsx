import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BookingSummary } from '@/api/types';
import { dayLabel, placeLabel, rand } from '@/lib/format';
import { BOOKING_META } from '@/lib/jobMeta';
import { Avatar, Badge, Card, Text, colors, enter, space } from '@/ui';

export function BookingCard({ b, index, onPress }: { b: BookingSummary; index: number; onPress: () => void }) {
  const meta = BOOKING_META[b.status];
  const name = `${b.other.firstName} ${b.other.lastName}`;
  const needsMe =
    (b.role === 'client' && (b.status === 'awaiting_payment' || b.status === 'completed')) || (b.role === 'handyman' && (b.status === 'funded' || b.status === 'in_progress'));
  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card onPress={onPress} style={styles.card} accessibilityLabel={`${b.title}, ${meta.label}, with ${name}`}>
        <View style={styles.top}>
          <Avatar uri={b.other.avatar} name={name} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {b.title}
            </Text>
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {b.role === 'client' ? 'with' : 'for'} {name}
              {b.place ? ` · ${placeLabel(b.place)}` : ''}
            </Text>
          </View>
          <Text variant="subheading">{rand(b.role === 'handyman' ? b.handymanPayout : b.amount)}</Text>
        </View>
        <View style={styles.meta}>
          <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
          {b.scheduledFor && b.status !== 'confirmed' && b.status !== 'cancelled' && (
            <View style={styles.inline}>
              <Ionicons name="calendar-outline" size={14} color={colors.inkTertiary} />
              <Text variant="caption" tone="tertiary">
                {dayLabel(b.scheduledFor)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {needsMe && <Badge label="Action needed" tone="warning" />}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
