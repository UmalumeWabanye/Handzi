import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { colors, space } from './theme';

type Props = { title?: string; onBack?: (() => void) | null; right?: React.ReactNode; close?: boolean };

/** Consistent top bar: back/close button, centred title, optional trailing action. */
export function ScreenHeader({ title, onBack, right, close }: Props) {
  const back = onBack === null ? null : onBack ?? (() => router.back());
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {back && <IconButton icon={close ? 'close' : 'chevron-back'} label={close ? 'Close' : 'Back'} onPress={back} />}
      </View>
      <Text variant="subheading" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title ?? ''}
      </Text>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    gap: space.sm,
    backgroundColor: colors.bg,
  },
  side: { width: 64 },
  title: { flex: 1, textAlign: 'center' },
});
