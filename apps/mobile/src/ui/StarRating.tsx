import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { ease } from './motion';
import { ScalePressable } from './Pressable';
import { colors, space } from './theme';

const POP_UP = { duration: 120, easing: ease.out };
const POP_DOWN = { duration: 180, easing: ease.inOut };

function Star({ filled, size, onPress, index }: { filled: boolean; size: number; onPress?: () => void; index: number }) {
  const up = POP_UP;
  const down = POP_DOWN;
  // Re-run the pop whenever the star becomes filled.
  const style = useAnimatedStyle(() => ({ transform: [{ scale: filled ? withSequence(withTiming(1.25, up), withTiming(1, down)) : withTiming(1, down) }] }), [filled]);
  const icon = <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={filled ? colors.star : colors.starOutline} />;
  if (!onPress) return icon;
  return (
    <ScalePressable onPress={onPress} hitSlop={6} scaleTo={0.9} accessibilityRole="radio" accessibilityLabel={`${index + 1} star${index ? 's' : ''}`} accessibilityState={{ selected: filled }}>
      <Animated.View style={style}>{icon}</Animated.View>
    </ScalePressable>
  );
}

/** Read-only stars, or a tappable 1–5 picker when onChange is given. */
export function StarRating({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={styles.row} accessibilityRole={onChange ? 'radiogroup' : 'text'} accessibilityLabel={onChange ? 'Rating' : `${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          index={i}
          size={size}
          filled={i < Math.round(value)}
          onPress={
            onChange
              ? () => {
                  haptic.select();
                  onChange(i + 1);
                }
              : undefined
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: space.xs } });
