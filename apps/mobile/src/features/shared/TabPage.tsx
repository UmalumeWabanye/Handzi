import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Screen, Text, enter, space } from '@/ui';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Top-level tab screen with a large title. */
export function TabPage({ title, subtitle, right, children, scroll = true, refreshing, onRefresh }: Props) {
  return (
    <Screen scroll={scroll} refreshing={refreshing} onRefresh={onRefresh}>
      <Animated.View entering={enter.up(0, 6)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          {subtitle && (
            <Text variant="body" tone="secondary">
              {subtitle}
            </Text>
          )}
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
        </View>
        {right}
      </Animated.View>
      {children}
    </Screen>
  );
}
