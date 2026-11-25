import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { haptic } from '@/lib/haptics';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, space } from './theme';

export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const accent = useAccent();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {hint && (
          <Text variant="caption" tone="tertiary">
            {hint}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic.select();
          onChange(v);
        }}
        trackColor={{ true: accent.main, false: colors.borderStrong }}
        thumbColor="#fff"
        ios_backgroundColor={colors.borderStrong}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 } });
