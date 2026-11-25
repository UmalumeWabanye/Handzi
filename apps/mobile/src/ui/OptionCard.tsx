import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { timing } from './motion';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, radius, space } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

const BORDER = timing(200);

/** Large radio-style choice (urgency, trade tiles). */
export function OptionCard({ title, subtitle, icon, selected, onPress, compact }: Props) {
  const accent = useAccent();
  const config = BORDER;
  const frame = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? accent.main : colors.border, config),
    backgroundColor: withTiming(selected ? accent.softer : colors.surface, config),
  }));
  return (
    <ScalePressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      scaleTo={0.97}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={compact ? styles.compactWrap : undefined}
    >
      <Animated.View style={[styles.card, compact && styles.compact, frame]}>
        {icon && (
          <View style={[styles.icon, { backgroundColor: selected ? accent.main : accent.softer }]}>
            <Ionicons name={icon} size={compact ? 22 : 20} color={selected ? '#fff' : accent.main} />
          </View>
        )}
        <View style={compact ? { alignItems: 'center' } : { flex: 1, gap: 2 }}>
          <Text variant={compact ? 'label' : 'bodyStrong'} center={compact} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && !compact && (
            <Text variant="caption" tone="tertiary">
              {subtitle}
            </Text>
          )}
        </View>
        {!compact && <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? accent.main : colors.inkDisabled} />}
      </Animated.View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1.5 },
  compactWrap: { width: '31.5%' },
  compact: { flexDirection: 'column', justifyContent: 'center', gap: space.sm, padding: space.md, aspectRatio: 1 },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
