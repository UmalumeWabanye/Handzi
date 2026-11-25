import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAccent } from './side';
import { Text } from './Text';
import { duration, ease, timing } from './motion';
import { colors, radius, space } from './theme';

const BORDER_TIMING = timing(duration.fast);
const SCALE_TIMING = { duration: duration.fast, easing: ease.out };

type Props = { value: string; onChange: (v: string) => void; length?: number; onComplete?: (v: string) => void; error?: boolean };

function Box({ char, active, filled, error }: { char: string; active: boolean; filled: boolean; error?: boolean }) {
  const accent = useAccent();
  const colorConfig = BORDER_TIMING;
  const scaleConfig = SCALE_TIMING;
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(error ? colors.danger : active ? accent.main : filled ? colors.borderStrong : colors.border, colorConfig),
    transform: [{ scale: withTiming(active ? 1.05 : 1, scaleConfig) }],
  }));
  return (
    <Animated.View style={[styles.box, style]}>
      <Text variant="title">{char}</Text>
    </Animated.View>
  );
}

/** One-time-code input drawn as separate boxes, backed by a single hidden TextInput (keeps SMS autofill working). */
export function CodeInput({ value, onChange, length = 6, onComplete, error }: Props) {
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(true);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code" accessibilityHint="Enter the 6 digit code">
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => (
          <Box key={i} char={value[i] ?? ''} filled={i < value.length} active={focused && i === Math.min(value.length, length - 1)} error={error} />
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
