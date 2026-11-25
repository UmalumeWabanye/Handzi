import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalePressable } from './Pressable';
import { Text } from './Text';
import { colors, palette, radius, sizes, space } from './theme';

/**
 * Buttons per BRAND.md §6 (height 48, radius 10, Inter 600 16, sentence case):
 * primary = Brick/white · secondary = Sunshine/Charcoal · outline = 1.5px Charcoal · ghost = Brick text · danger = Danger/white.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const LOOK: Record<Variant, { bg: string; fg: string; border: string; borderWidth: number }> = {
  primary: { bg: palette.brick, fg: colors.onAccent, border: palette.brick, borderWidth: 1 },
  secondary: { bg: palette.sunshine, fg: colors.onHighlight, border: palette.sunshine, borderWidth: 1 },
  outline: { bg: 'transparent', fg: palette.charcoal, border: palette.charcoal, borderWidth: 1.5 },
  ghost: { bg: 'transparent', fg: palette.brick, border: 'transparent', borderWidth: 1 },
  danger: { bg: palette.danger, fg: colors.onAccent, border: palette.danger, borderWidth: 1 },
};

export function Button({ title, onPress, variant = 'primary', size = 'lg', icon, iconRight, loading, disabled, style, accessibilityHint }: Props) {
  const inactive = disabled || loading;
  const look = LOOK[variant];

  return (
    <ScalePressable
      onPress={onPress}
      disabled={inactive}
      hapticFeedback={variant === 'primary'}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        { backgroundColor: look.bg, borderColor: look.border, borderWidth: look.borderWidth, paddingHorizontal: size === 'lg' ? space.xl : space.lg },
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={20} color={look.fg} />}
          <Text variant={size === 'lg' ? 'bodyStrong' : 'label'} color={look.fg} numberOfLines={1}>
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={18} color={look.fg} />}
        </View>
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: sizes.button, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  inactive: { opacity: 0.4 },
});
