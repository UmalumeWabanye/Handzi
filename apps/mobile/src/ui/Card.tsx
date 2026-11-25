import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ScalePressable } from './Pressable';
import { colors, radius, space } from './theme';

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean; accessibilityLabel?: string };

/** White card, radius 16, 1px Line border, 16 padding (BRAND.md §6). Shadows are kept for floating things. */
export function Card({ children, style, onPress, padded = true, accessibilityLabel }: Props) {
  const s = [styles.card, padded && styles.padded, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return (
    <ScalePressable onPress={onPress} style={s} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {children}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  padded: { padding: space.lg },
});
