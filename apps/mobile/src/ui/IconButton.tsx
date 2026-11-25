import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalePressable } from './Pressable';
import { colors, hitSlop, radius } from './theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
  background?: string;
  size?: number;
};

export function IconButton({ icon, onPress, label, color = colors.ink, background = colors.surface, size = 40 }: Props) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlop}
      scaleTo={0.9}
      style={[styles.base, { width: size, height: size, backgroundColor: background }]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
});
