import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { Ionicons } from '@expo/vector-icons';
import { enter } from './motion';
import { Text } from './Text';
import { space } from './theme';

const MARK = require('../../assets/brand/handzi-mark-512.png');

type Props = {
  /** Kept for call sites; empty states show the Handzi mark (BRAND.md §6). */
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  text?: string;
  action?: React.ReactNode;
  compact?: boolean;
};

/** Handzi mark + one friendly line + (optionally) one action. */
export function EmptyState({ title, text, action, compact }: Props) {
  return (
    <Animated.View entering={enter.fade(80)} style={[styles.wrap, compact && styles.compact]}>
      <Image source={MARK} style={compact ? styles.markSm : styles.mark} contentFit="contain" accessibilityIgnoresInvertColors accessible={false} />
      <Text variant="subheading" center>
        {title}
      </Text>
      {text && (
        <Text variant="body" tone="secondary" center style={{ maxWidth: 300 }}>
          {text}
        </Text>
      )}
      {action && <View style={{ marginTop: space.sm, alignSelf: 'stretch' }}>{action}</View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xxl },
  compact: { flex: 0, paddingVertical: space.xl },
  mark: { width: 56, height: 56, marginBottom: space.xs },
  markSm: { width: 40, height: 40, marginBottom: space.xs },
});
