import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAccent } from './side';
import { Text } from './Text';
import { duration, ease } from './motion';
import { colors, radius, sizes, space, type } from './theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
  prefix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  minLength?: number; // shows a "x / min" counter for long-form fields
  optional?: boolean;
};

export const TextField = forwardRef<TextInputInstance, Props>(function TextField(
  { label, hint, error, prefix, icon, minLength, optional, multiline, maxLength, value, onFocus, onBlur, style, ...rest },
  ref
) {
  const accent = useAccent();
  const focus = useSharedValue(0);
  const [focused, setFocused] = useState(false);

  // Focus ring sits outside the field and fades in, so the text never shifts.
  const ring = useAnimatedStyle(() => ({ opacity: focus.value }));

  const length = value?.length ?? 0;
  const counter = minLength && length < minLength ? `${length} / ${minLength} minimum` : maxLength && focused ? `${length} / ${maxLength}` : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {optional && (
          <Text variant="caption" tone="tertiary">
            Optional
          </Text>
        )}
      </View>
      <View style={[styles.frame, multiline && styles.frameMultiline, { borderColor: error ? colors.danger : colors.border }]}>
        <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
        {icon && <Ionicons name={icon} size={18} color={colors.inkTertiary} />}
        {prefix && (
          <Text variant="bodyStrong" tone="secondary">
            {prefix}
          </Text>
        )}
        <TextInput
          ref={ref}
          value={value}
          multiline={multiline}
          maxLength={maxLength}
          placeholderTextColor={colors.placeholder}
          selectionColor={accent.main}
          accessibilityLabel={label}
          accessibilityHint={hint}
          onFocus={(e) => {
            setFocused(true);
            focus.value = withTiming(1, { duration: duration.fast, easing: ease.out });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focus.value = withTiming(0, { duration: duration.fast, easing: ease.inOut });
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint || counter ? (
        <View style={styles.labelRow}>
          <Text variant="caption" tone="tertiary" style={{ flex: 1 }}>
            {hint ?? ''}
          </Text>
          {counter && (
            <Text variant="caption" tone="tertiary">
              {counter}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  frame: {
    minHeight: sizes.input,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md + 2,
    gap: space.sm,
  },
  frameMultiline: { alignItems: 'flex-start', paddingVertical: space.md },
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: radius.md + 4, borderWidth: 3, borderColor: colors.focus },
  input: { flex: 1, ...type.body, color: colors.ink, paddingVertical: space.md },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top', paddingVertical: 0 },
});
