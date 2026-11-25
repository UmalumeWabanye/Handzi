import { Platform } from 'react-native';
import tokens from '../../../../handzi-brand/tokens/tokens.json';

/**
 * Handzi design tokens for React Native.
 * Every value comes from `handzi-brand/tokens/tokens.json` (the brand's source of truth); components import from
 * `@/ui` and never hard-code colours, sizes or fonts. See handzi-brand/BRAND.md.
 */

const c = tokens.color;
const px = (v: string) => parseFloat(v);

export const palette = {
  orange: c.brand.orange.value, // graphics, logo, icons, large text only
  brick: c.brand.brick.value, // primary buttons (white text), links, active states
  brickDark: c.brand.brickDark.value,
  sunshine: c.brand.sunshine.value, // highlights, stars, badges, secondary buttons (charcoal text)
  sunshineDark: c.brand.sunshineDark.value,
  charcoal: c.neutral.charcoal.value,
  graphite: c.neutral.graphite.value,
  steel: c.neutral.steel.value,
  mist: c.neutral.mist.value,
  line: c.neutral.line.value,
  chalk: c.neutral.chalk.value,
  white: c.neutral.white.value,
  success: c.status.success.value,
  danger: c.status.danger.value,
  info: c.status.info.value,
};

/** Semantic colours. Use these in components. */
export const colors = {
  bg: palette.chalk,
  surface: palette.white,
  surfaceMuted: palette.chalk,
  border: palette.line,
  borderStrong: palette.mist, // non-text strokes (empty radio, switch track)
  ink: palette.charcoal,
  inkSecondary: palette.steel,
  inkTertiary: palette.steel,
  inkDisabled: palette.mist, // decorative icons only; never text on light (fails contrast)
  placeholder: palette.steel,
  onAccent: palette.white,
  onHighlight: palette.charcoal, // text on Sunshine
  success: palette.success,
  danger: palette.danger,
  info: palette.info,
  // TODO(brand): the kit has no warning colour. "Needs attention" states use Sunshine with Charcoal text,
  // and Brick Dark where a warning needs coloured text.
  warning: palette.brickDark,
  highlight: palette.sunshine,
  star: palette.sunshine,
  starOutline: palette.sunshineDark,
  focus: palette.orange, // 3px focus ring
  scrim: 'rgba(28,31,36,0.55)', // Charcoal overlay (BRAND.md §7: 50–70%)
};

export type Side = 'client' | 'handyman';

/**
 * Accent roles. Both sides of the app share the brand colours (the kit defines no per-side palette);
 * the side is shown with copy and icons instead.
 */
export type Accent = { main: string; pressed: string; dark: string; soft: string; softer: string; graphic: string };
const brandAccent: Accent = {
  main: palette.brick, // buttons, links, active states, selected controls
  pressed: palette.brickDark,
  dark: palette.brickDark, // accent-coloured text on light tints
  soft: palette.sunshine, // highlight surfaces (Charcoal text on top)
  softer: palette.chalk, // quiet tinted surfaces (icon tiles, selected rows)
  graphic: palette.orange, // brand graphics and decorative icons
};
export const accents: Record<Side, Accent> = { client: brandAccent, handyman: brandAccent };

const s = tokens.space;
export const space = {
  xxs: 2,
  xs: px(s['1']),
  sm: px(s['2']),
  md: px(s['3']),
  lg: px(s['4']),
  xl: px(s['5']),
  xxl: px(s['6']),
  xxxl: px(s['8']),
  huge: px(s['12']),
  screen: px(s['4']), // screen side padding on phones (16)
} as const;

const r = tokens.radius;
export const radius = {
  xs: px(r.sm),
  sm: px(r.sm), // chips, small tiles (6)
  md: px(r.md), // buttons, inputs (10)
  lg: px(r.lg), // cards (16)
  xl: px(r.xl), // sheets (24)
  pill: px(r.pill),
} as const;

/** Font family names registered in the root layout (expo-font). */
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const fs = tokens.fontSize;
const size = (k: keyof typeof fs) => ({ fontSize: px(fs[k].value), lineHeight: px(fs[k].lineHeight) });
const tracking = (k: keyof typeof fs, em: number) => ({ letterSpacing: px(fs[k].value) * em });

/**
 * Type scale (BRAND.md §4). Bricolage Grotesque 800 for display/h1/h2 with −0.03em tracking; Inter for everything else.
 * No `fontWeight` here: with custom fonts the weight is the font file.
 */
export const type = {
  display: { ...size('display'), ...tracking('display', -0.03), fontFamily: fonts.display },
  title: { ...size('h1'), ...tracking('h1', -0.03), fontFamily: fonts.display },
  heading: { ...size('h2'), ...tracking('h2', -0.02), fontFamily: fonts.display },
  subheading: { ...size('h3'), fontFamily: fonts.semibold },
  body: { ...size('body'), fontFamily: fonts.regular },
  bodyStrong: { ...size('body'), fontFamily: fonts.semibold },
  caption: { ...size('small'), fontFamily: fonts.regular },
  label: { ...size('small'), fontFamily: fonts.semibold },
  tiny: { ...size('caption'), fontFamily: fonts.medium },
  overline: { ...size('caption'), fontFamily: fonts.semibold, letterSpacing: 0.6, textTransform: 'uppercase' as const },
} as const;

// tokens.shadow: card "0 1px 2px .06, 0 2px 8px .06", raised "0 4px 16px .12", sheet "0 -8px 32px .16"
export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: palette.charcoal, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    default: { elevation: 1 },
  }),
  md: Platform.select({
    ios: { shadowColor: palette.charcoal, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 4 },
  }),
  sheet: Platform.select({
    ios: { shadowColor: palette.charcoal, shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: -8 } },
    default: { elevation: 12 },
  }),
};

const m = tokens.motion;
export const motion = {
  fast: px(m.fast),
  base: px(m.base),
  slow: px(m.slow),
  stagger: 40,
  pressScale: 0.97,
};

export const sizes = {
  touch: px(tokens.size.touchTarget),
  button: px(tokens.size.buttonHeight),
  input: px(tokens.size.inputHeight),
  avatarSm: px(tokens.size.avatarSm),
  avatarLg: px(tokens.size.avatarLg),
};

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
