import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, space } from './theme';

/** Icon + label + value line used on job and quote details. */
export function DetailRow({ icon, label, value, emphasis }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={18} color={colors.inkTertiary} style={{ marginTop: 2 }} />
      <Text variant="body" tone="secondary" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant={emphasis ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingVertical: space.xs } });
