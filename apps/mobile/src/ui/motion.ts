import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
  Keyframe,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

/**
 * One motion language for the whole app.
 * Rules: ease-out for things arriving, ease-in for things leaving, short distances,
 * no overshoot. Springs only for touch feedback, and they're critically damped.
 */
export const ease = {
  out: Easing.bezier(0.2, 0.8, 0.2, 1), // brand easing (tokens.motion.easing): arrive fast, settle gently
  in: Easing.bezier(0.55, 0, 1, 0.45), // leave: quick and quiet
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // move/resize/colour
  sine: Easing.inOut(Easing.sin), // loops
};

// tokens.motion: fast 120, base 200, slow 320
export const duration = { xfast: 120, fast: 160, base: 200, slow: 320 } as const;

const STAGGER = 45;
const MAX_STAGGERED = 6; // later items arrive together so long lists never feel slow

/** No overshoot: settles quickly and smoothly. Use for press feedback. */
export const crispSpring = { damping: 30, stiffness: 380, mass: 0.7, overshootClamping: true } as const;

/**
 * Timing config for withTiming. Marked as a worklet so it is also safe inside useAnimatedStyle,
 * but prefer building the config outside the worklet (see Chip) and capturing the result.
 */
export const timing = (ms: number = duration.base) => {
  'worklet';
  return { duration: ms, easing: ease.inOut };
};

export const enter = {
  /** Fade in while rising a short distance. */
  up: (delay = 0, distance = 10) =>
    FadeInDown.duration(duration.slow).delay(delay).easing(ease.out).withInitialValues({ opacity: 0, transform: [{ translateY: distance }] }),
  /** `up` with a capped stagger for list items. */
  stagger: (index: number, base = 0) => enter.up(base + Math.min(index, MAX_STAGGERED) * STAGGER),
  fade: (delay = 0) => FadeIn.duration(duration.base).delay(delay).easing(ease.out),
  /** Small scale-up for things that appear in place (photos, pins, badges). */
  pop: (delay = 0) =>
    new Keyframe({
      0: { opacity: 0, transform: [{ scale: 0.88 }] },
      100: { opacity: 1, transform: [{ scale: 1 }], easing: ease.out },
    })
      .duration(duration.base)
      .delay(delay),
  fromTop: () => FadeInUp.duration(duration.base).easing(ease.out).withInitialValues({ opacity: 0, transform: [{ translateY: -14 }] }),
  sheet: () => SlideInDown.duration(duration.slow).easing(ease.out),
  /** Wizard steps: short horizontal glide in the direction of travel. */
  step: (dir: 1 | -1) =>
    (dir === 1 ? FadeInRight : FadeInLeft)
      .duration(duration.slow)
      .delay(60)
      .easing(ease.out)
      .withInitialValues({ opacity: 0, transform: [{ translateX: 28 * dir }] }),
};

export const exit = {
  fade: () => FadeOut.duration(duration.fast).easing(ease.in),
  pop: () =>
    new Keyframe({
      0: { opacity: 1, transform: [{ scale: 1 }] },
      100: { opacity: 0, transform: [{ scale: 0.9 }], easing: ease.in },
    }).duration(duration.fast),
  toTop: () => FadeOutUp.duration(duration.fast).easing(ease.in),
  sheet: () => SlideOutDown.duration(duration.base).easing(ease.in),
  step: (dir: 1 | -1) => (dir === 1 ? FadeOutLeft : FadeOutRight).duration(duration.fast).easing(ease.in),
};

/** Layout changes (items added/removed, wrapping). */
export const layout = () => LinearTransition.duration(duration.base).easing(ease.inOut);
