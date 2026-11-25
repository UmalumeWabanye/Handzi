import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, palette, radius, space } from './theme';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/**
 * Pill badges (BRAND.md §6): highlights on Sunshine with Charcoal text; Verified/done on Success with white text.
 * TODO(brand): no warning colour in the kit, so "needs attention" uses the Sunshine highlight.
 */
const LOOK: Record<Tone, { bg: string; fg: string; border?: string }> = {
  accent: { bg: palette.sunshine, fg: colors.onHighlight },
  warning: { bg: palette.sunshine, fg: colors.onHighlight },
  success: { bg: palette.success, fg: colors.onAccent },
  danger: { bg: palette.danger, fg: colors.onAccent },
  info: { bg: palette.info, fg: colors.onAccent },
  neutral: { bg: colors.surfaceMuted, fg: colors.inkSecondary, border: colors.border },
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: keyof typeof Ionicons.glyphMap }) {
  const look = LOOK[tone];
  return (
    <View style={[styles.badge, { backgroundColor: look.bg, borderColor: look.border ?? look.bg }]}>
      {icon && <Ionicons name={icon} size={13} color={look.fg} />}
      <Text variant="tiny" color={look.fg} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
