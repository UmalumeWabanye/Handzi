import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ease } from './motion';
import { colors, radius, space } from './theme';

export function Skeleton({ width = '100%', height = 16, round, style }: { width?: DimensionValue; height?: number; round?: boolean; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    if (!reduced) opacity.value = withRepeat(withTiming(1, { duration: 900, easing: ease.sine }), -1, true);
  }, [opacity, reduced]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: round ? height / 2 : radius.sm, backgroundColor: colors.border }, pulse, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Placeholder shaped like a HandymanCard. */
export function CardSkeleton() {
  return (
    <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <Skeleton width={52} height={52} round />
        <View style={{ flex: 1, gap: space.sm }}>
          <Skeleton width="55%" />
          <Skeleton width="80%" height={12} />
        </View>
      </View>
      <Skeleton height={12} width="40%" />
    </View>
  );
}
