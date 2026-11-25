import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors, ease, radius, space } from '@/ui';

const UP = { duration: 280, easing: ease.out };
const DOWN = { duration: 280, easing: ease.inOut };

function Dot({ delay }: { delay: number }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!reduced) y.value = withDelay(delay, withRepeat(withSequence(withTiming(-4, UP), withTiming(0, DOWN), withTiming(0, { duration: 260 })), -1, false));
  }, [delay, reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: 0.45 + Math.abs(y.value) / 8 }));
  return <Animated.View style={[styles.dot, style]} />;
}

/** "…" bubble shown while the other person is typing. */
export function TypingDots() {
  return (
    <View style={styles.bubble} accessibilityLabel="Typing" accessibilityLiveRegion="polite">
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: space.lg,
    paddingVertical: space.md + 2,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inkTertiary },
});
