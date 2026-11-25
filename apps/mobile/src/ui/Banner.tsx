import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { enter, exit } from './motion';
import { Text } from './Text';
import { colors, palette, radius, space } from './theme';

type Tone = 'info' | 'success' | 'warning' | 'danger';
const ICON: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'time',
  danger: 'alert-circle',
};

/**
 * Inline notice. Status colours always come with an icon and words (BRAND.md §9).
 * Warning uses the Sunshine highlight with Charcoal text (TODO(brand): no warning colour in the kit).
 */
const LOOK: Record<Tone, { bg: string; border: string; icon: string; title: string }> = {
  info: { bg: colors.surface, border: colors.border, icon: palette.info, title: colors.ink },
  success: { bg: colors.surface, border: palette.success, icon: palette.success, title: palette.success },
  warning: { bg: palette.sunshine, border: palette.sunshine, icon: palette.charcoal, title: palette.charcoal },
  danger: { bg: colors.surface, border: palette.danger, icon: palette.danger, title: palette.danger },
};

type Props = { tone?: Tone; title?: string; message?: string | null; children?: React.ReactNode; icon?: keyof typeof Ionicons.glyphMap };

export function Banner({ tone = 'info', title, message, children, icon }: Props) {
  if (!message && !title) return null;
  const look = LOOK[tone];
  return (
    <Animated.View
      entering={enter.up(0, 6)}
      exiting={exit.fade()}
      layout={LinearTransition.duration(200)}
      style={[styles.box, { backgroundColor: look.bg, borderColor: look.border }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon ?? ICON[tone]} size={20} color={look.icon} />
      <View style={{ flex: 1, gap: 2 }}>
        {title && (
          <Text variant="bodyStrong" color={look.title}>
            {title}
          </Text>
        )}
        {message && (
          <Text variant="caption" color={tone === 'warning' ? palette.charcoal : tone === 'danger' && !title ? palette.danger : colors.inkSecondary}>
            {message}
          </Text>
        )}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: space.md, padding: space.md + 2, borderRadius: radius.md, borderWidth: 1, alignItems: 'flex-start' },
});
