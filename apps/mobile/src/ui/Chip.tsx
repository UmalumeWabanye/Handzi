import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { layout, timing } from './motion';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, palette, radius, space } from './theme';

const CHIP_TIMING = timing(200);

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  onRemove?: () => void;
  size?: 'sm' | 'md';
};

/** Pill chip (BRAND.md §6): Chalk with Charcoal text; selected = Charcoal with white text. */
export function Chip({ label, selected = false, onPress, icon, onRemove, size = 'md' }: ChipProps) {
  const accent = useAccent();
  const config = CHIP_TIMING;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? palette.charcoal : colors.surfaceMuted, config),
    borderColor: withTiming(selected ? palette.charcoal : colors.border, config),
  }));
  const fg = selected ? colors.onAccent : colors.ink;
  const interactive = !!onPress;

  const body = (
    <Animated.View style={[styles.chip, size === 'sm' && styles.sm, fill]}>
      {selected && interactive ? (
        <Ionicons name="checkmark" size={16} color={palette.sunshine} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={selected ? palette.sunshine : accent.graphic} />
      ) : null}
      <Text variant={size === 'sm' ? 'tiny' : 'label'} color={fg}>
        {label}
      </Text>
      {onRemove && (
        <ScalePressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${label}`} hitSlop={10}>
          <Ionicons name="close" size={16} color={fg} />
        </ScalePressable>
      )}
    </Animated.View>
  );

  if (!interactive) return body;
  return (
    <ScalePressable
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      scaleTo={0.94}
      hitSlop={{ top: 6, bottom: 6 }} // 36px chip → 48px touch target
    >
      {body}
    </ScalePressable>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View layout={layout()} style={styles.group}>
      {children}
    </Animated.View>
  );
}

export const ChipRow = ({ children }: { children: React.ReactNode }) => <View style={styles.group}>{children}</View>;

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    minHeight: 36,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sm: { minHeight: 28, paddingHorizontal: space.md },
});
