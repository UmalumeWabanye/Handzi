import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { hitSlop, space } from './theme';

type Props = { title: string; action?: string; onAction?: () => void; subtitle?: string; children?: React.ReactNode };

/** Titled block of content with an optional trailing action ("Edit", "See all"). */
export function Section({ title, action, onAction, subtitle, children }: Props) {
  const accent = useAccent();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" tone="tertiary">
              {subtitle}
            </Text>
          )}
        </View>
        {action && onAction && (
          <ScalePressable onPress={onAction} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={`${action} ${title}`}>
            <Text variant="label" color={accent.main}>
              {action}
            </Text>
          </ScalePressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
});
