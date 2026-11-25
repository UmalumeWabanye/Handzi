import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { duration, ease } from './motion';
import { ScalePressable } from './Pressable';
import { Text } from './Text';
import { colors, radius, shadow, space } from './theme';

type Option<T extends string> = { value: T; label: string; count?: number };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (v: T) => void };

const SLIDE = { duration: duration.base, easing: ease.out };

/** Two-to-four way switch with a sliding thumb. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width / options.length;
  const config = SLIDE;
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(index * segment, config) }] }));

  return (
    <View style={styles.track} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8)} accessibilityRole="tablist">
      {width > 0 && <Animated.View style={[styles.thumb, { width: segment }, thumb]} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ScalePressable
            key={o.value}
            style={styles.option}
            scaleTo={0.97}
            onPress={() => {
              if (!active) {
                haptic.select();
                onChange(o.value);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.count != null ? `${o.label}, ${o.count}` : o.label}
          >
            <Text variant="label" tone={active ? 'primary' : 'tertiary'}>
              {o.label}
              {o.count != null && o.count > 0 ? ` · ${o.count}` : ''}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 4 },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: colors.surface, borderRadius: radius.sm, ...shadow.sm },
  option: { flex: 1, minHeight: 40, // + track padding = 48 touch target
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
});
