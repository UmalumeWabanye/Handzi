import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, colors, ease, enter, space, useAccent } from '@/ui';

type Props = { title: string; message: string; cta: string; onContinue: () => void; footnote?: string };

/** Celebration screen at the end of onboarding. */
export function Success({ title, message, cta, onContinue, footnote }: Props) {
  const accent = useAccent();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!reduced) pulse.value = withDelay(420, withSequence(withTiming(1.08, { duration: 260, easing: ease.out }), withTiming(1, { duration: 420, easing: ease.inOut })));
  }, [pulse, reduced]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <SafeAreaView style={styles.fill} edges={['bottom']}>
      <View style={styles.center}>
        <Animated.View style={[styles.ringOuter, { backgroundColor: accent.soft }, ring]}>
          <Animated.View entering={enter.pop(120)} style={[styles.ringInner, { backgroundColor: accent.main }]}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </Animated.View>
        </Animated.View>
        <Animated.View entering={enter.up(300)} style={{ gap: space.sm, alignItems: 'center' }}>
          <Text variant="display" center>
            {title}
          </Text>
          <Text variant="body" tone="secondary" center style={{ maxWidth: 320 }}>
            {message}
          </Text>
        </Animated.View>
      </View>
      <Animated.View entering={enter.up(460)} style={styles.footer}>
        <Button title={cta} iconRight="arrow-forward" onPress={onContinue} />
        {footnote && (
          <Text variant="caption" tone="tertiary" center>
            {footnote}
          </Text>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxl, padding: space.xl },
  ringOuter: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: space.xl, gap: space.md },
});
