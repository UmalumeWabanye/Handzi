import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ease } from './motion';
import { colors, palette, radius } from './theme';

const FILL = { duration: 480, easing: ease.out };
const TICK_GAP = 12; // BRAND.md §6: 2px Charcoal ticks every 12–16px

/** Progress as a measuring tape: Sunshine band with Charcoal ticks (the brand's tape-ticks motif). */
export function ProgressBar({ value, height = 10, color }: { value: number; height?: number; color?: string }) {
  const progress = useSharedValue(0);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), FILL);
  }, [value, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const ticks = Math.floor(width / TICK_GAP);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { height, borderRadius: radius.xs }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color ?? palette.sunshine }, fill]}>
        <View style={[styles.ticks, { width }]} pointerEvents="none">
          {Array.from({ length: ticks }, (_, i) => (
            <View key={i} style={[styles.tick, { left: (i + 1) * TICK_GAP, height: height * 0.5 }]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
  ticks: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  tick: { position: 'absolute', top: 0, width: 2, backgroundColor: palette.charcoal },
});
