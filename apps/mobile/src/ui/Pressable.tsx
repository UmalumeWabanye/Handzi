import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { crispSpring, duration, ease } from './motion';
import { motion } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedback?: boolean;
};

/** Pressable that gently scales down while pressed. The base interaction for every tappable surface. */
export function ScalePressable({ style, scaleTo = motion.pressScale, hapticFeedback, onPressIn, onPressOut, onPress, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        // Press down quickly on a curve, release with a critically damped spring: responsive, never wobbly.
        scale.value = withTiming(scaleTo, { duration: duration.xfast, easing: ease.out });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, crispSpring);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (hapticFeedback) haptic.tap();
        onPress?.(e);
      }}
      style={[style, animated]}
    />
  );
}
