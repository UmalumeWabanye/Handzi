import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BookingDetail } from '@/api/types';
import { dayLabel } from '@/lib/format';
import { Text, colors, ease, space, useAccent } from '@/ui';

const FILL = { duration: 420, easing: ease.out };

type Step = { key: string; label: string; at?: string };

function Connector({ done, index }: { done: boolean; index: number }) {
  const accent = useAccent();
  const config = FILL;
  const delay = index * 90;
  // Scale (not height) so it animates identically on iOS and Android.
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: withDelay(delay, withTiming(done ? 1 : 0, config)) }], backgroundColor: accent.main }), [done]);
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, style]} />
    </View>
  );
}

/** Vertical progress: Booked → Paid → Started → Completed → Confirmed. */
export function BookingTimeline({ booking }: { booking: BookingDetail }) {
  const accent = useAccent();
  const t = booking.timeline;
  const steps: Step[] = [
    { key: 'booked', label: 'Quote accepted', at: t.createdAt },
    { key: 'paid', label: 'Paid · held safely', at: t.paidAt },
    { key: 'started', label: 'Work started', at: t.startedAt },
    { key: 'completed', label: 'Marked as done', at: t.completedAt },
    { key: 'confirmed', label: 'Confirmed · payment released', at: t.confirmedAt },
  ];
  const current = steps.findIndex((s) => !s.at);

  return (
    <View accessibilityLabel={`Progress: ${steps.filter((s) => s.at).length} of ${steps.length} steps done`}>
      {steps.map((s, i) => {
        const done = !!s.at;
        const isCurrent = i === current && !['cancelled', 'disputed'].includes(booking.status);
        return (
          <View key={s.key} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, done ? { backgroundColor: accent.main, borderColor: accent.main } : isCurrent ? { borderColor: accent.main } : null]}>
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {i < steps.length - 1 && <Connector done={!!steps[i + 1].at} index={i} />}
            </View>
            <View style={styles.body}>
              <Text variant={isCurrent ? 'bodyStrong' : 'body'} tone={done || isCurrent ? 'primary' : 'tertiary'}>
                {s.label}
              </Text>
              {s.at && (
                <Text variant="caption" tone="tertiary">
                  {dayLabel(s.at)} · {new Date(s.at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 22 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, width: 2, minHeight: 22, backgroundColor: colors.border, marginVertical: 2, overflow: 'hidden' },
  fill: { width: 2, height: '100%', transformOrigin: 'top' },
  body: { flex: 1, paddingBottom: space.lg, gap: 1, paddingTop: 1 },
});
