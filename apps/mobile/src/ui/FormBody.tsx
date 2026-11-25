import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { enter } from './motion';
import { colors, space } from './theme';

type Props = { children: React.ReactNode; footer?: React.ReactNode; bottomInset?: number };

/** Scrollable form content with a footer pinned above the keyboard. Used by onboarding steps and edit screens. */
export function FormBody({ children, footer, bottomInset = 0 }: Props) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: space.md + bottomInset }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

/** Title block at the top of an onboarding step. */
export function StepIntro({ title, subtitle, overline }: { title: string; subtitle?: string; overline?: string }) {
  return (
    <Animated.View entering={enter.up(140, 8)} style={{ gap: space.sm }}>
      {overline && (
        <Text variant="overline" tone="tertiary">
          {overline}
        </Text>
      )}
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" tone="secondary">
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.screen, gap: space.xl, paddingBottom: space.xxxl },
  footer: {
    paddingHorizontal: space.screen,
    paddingTop: space.md,
    gap: space.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
