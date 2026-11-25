import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, radius, space } from './theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  tone?: 'default' | 'danger';
  done?: boolean; // shows a check instead of the icon tint
};

export function ListRow({ icon, title, subtitle, onPress, right, tone = 'default', done }: Props) {
  const accent = useAccent();
  const fg = tone === 'danger' ? colors.danger : accent.main;
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: accent.softer }]}>
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" color={tone === 'danger' ? colors.danger : undefined}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="tertiary" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ??
        (done !== undefined ? (
          <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.success : colors.inkDisabled} />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.inkDisabled} />
        ) : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <ScalePressable onPress={onPress} style={styles.row} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={subtitle}>
      {content}
    </ScalePressable>
  );
}

export const ListGroup = ({ children }: { children: React.ReactNode }) => <View style={styles.group}>{children}</View>;

const styles = StyleSheet.create({
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 56 },
  icon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
