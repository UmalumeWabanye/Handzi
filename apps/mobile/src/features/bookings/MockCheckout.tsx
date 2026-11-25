import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { usePayBooking } from '@/api/hooks';
import type { BookingDetail } from '@/api/types';
import { haptic } from '@/lib/haptics';
import { rand } from '@/lib/format';
import { Banner, Button, Card, Sheet, Text, colors, enter, palette, radius, space, useAccent } from '@/ui';

const SPIN = { duration: 900 };

function Spinner() {
  const accent = useAccent();
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, SPIN), -1, false);
  }, [r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name="sync" size={36} color={accent.main} />
    </Animated.View>
  );
}

type Props = { booking: BookingDetail; visible: boolean; onClose: () => void; onPaid: () => void };

/**
 * Test checkout for the MVP. Looks and behaves like a payment step (processing, success, decline)
 * but no real money moves. Swap for Paystack's checkout when going live.
 */
export function MockCheckout({ booking, visible, onClose, onPaid }: Props) {
  const pay = usePayBooking();
  const [state, setState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setState('idle');
      setError(null);
    }
  }, [visible]);

  const run = async (simulate: 'success' | 'decline') => {
    setError(null);
    setState('processing');
    try {
      await pay.mutateAsync({ id: booking._id, simulate });
      haptic.success();
      setState('done');
      setTimeout(onPaid, 900);
    } catch (e) {
      setState('idle');
      setError(errorMessage(e));
    }
  };

  return (
    <Sheet visible={visible} onClose={state === 'processing' ? () => {} : onClose} title={state === 'done' ? 'Payment successful' : 'Pay securely'}>
      {state === 'processing' ? (
        <Animated.View entering={enter.fade()} style={styles.center}>
          <Spinner />
          <Text variant="body" tone="secondary">
            Processing payment…
          </Text>
        </Animated.View>
      ) : state === 'done' ? (
        <Animated.View entering={enter.pop()} style={styles.center}>
          <View style={styles.tick}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text variant="body" tone="secondary" center>
            {rand(booking.amount)} is held safely until you confirm the job is done.
          </Text>
        </Animated.View>
      ) : (
        <Animated.View entering={enter.fade()} style={{ gap: space.md }}>
          <View style={styles.testBadge}>
            <Ionicons name="flask-outline" size={16} color={colors.onHighlight} />
            <Text variant="label" color={colors.onHighlight}>
              Test payment · no real money is charged
            </Text>
          </View>
          <Card style={{ gap: space.xs }}>
            <Text variant="caption" tone="tertiary">
              {booking.title}
            </Text>
            <View style={styles.between}>
              <Text variant="body" tone="secondary">
                Total
              </Text>
              <Text variant="title">{rand(booking.amount)}</Text>
            </View>
          </Card>
          <View style={styles.card}>
            <Ionicons name="card" size={22} color={colors.inkSecondary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Test card •••• 4242</Text>
              <Text variant="caption" tone="tertiary">
                Expires 12/30
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </View>
          <Banner tone="danger" message={error} />
          <Button title={`Pay ${rand(booking.amount)}`} icon="lock-closed" onPress={() => run('success')} />
          <Button title="Simulate a declined card" variant="ghost" size="md" onPress={() => run('decline')} />
          <Text variant="caption" tone="tertiary" center>
            Your money is held by Handzi and only released to {booking.other.firstName} once you confirm the job is done.
          </Text>
        </Animated.View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  tick: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  testBadge: { flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'center', backgroundColor: palette.sunshine, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong },
});
