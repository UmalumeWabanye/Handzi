import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, fonts, type } from './theme';

export type TextVariant = keyof typeof type;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'inverse';

const toneColor: Record<Tone, string> = {
  primary: colors.ink,
  secondary: colors.inkSecondary,
  tertiary: colors.inkTertiary,
  danger: colors.danger,
  success: colors.success,
  inverse: colors.onAccent,
};

// With custom fonts, weight must come from the font file (Android ignores/mismatches fontWeight).
const interByWeight: Record<string, string> = {
  '400': fonts.regular,
  normal: fonts.regular,
  '500': fonts.medium,
  '600': fonts.semibold,
  '700': fonts.bold,
  bold: fonts.bold,
  '800': fonts.bold,
};

export type TextProps = RNTextProps & { variant?: TextVariant; tone?: Tone; color?: string; center?: boolean };

export function Text({ variant = 'body', tone = 'primary', color, center, style, ...rest }: TextProps) {
  const base = type[variant];
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  let override: TextStyle | undefined = flat;
  if (flat?.fontWeight && base.fontFamily !== fonts.display) {
    const { fontWeight, ...others } = flat;
    override = { ...others, fontFamily: interByWeight[String(fontWeight)] ?? base.fontFamily };
  }
  return (
    <RNText
      maxFontSizeMultiplier={2}
      {...rest}
      style={[base, { color: color ?? toneColor[tone] }, center && { textAlign: 'center' }, override]}
    />
  );
}
