import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, ProgressBar, Text, colors, enter, exit, space } from '@/ui';

export type StepRenderProps = { next: () => void; back: () => void; goTo: (key: string) => void; bottomInset: number; stepIndex: number };
export type WizardStep = { key: string; label: string; render: (p: StepRenderProps) => React.ReactNode };

type Props = {
  steps: WizardStep[];
  initialStep?: number;
  onExit?: () => void; // back from the first step (e.g. log out)
  exitIcon?: 'close' | 'log-out-outline';
  hideProgressOn?: string[]; // step keys that render full-bleed (e.g. success)
};

/**
 * Multi-step flow with an animated progress bar and direction-aware slide transitions.
 * Each step renders its own content + footer; the wizard only owns navigation.
 */
export function Wizard({ steps, initialStep = 0, onExit, exitIcon = 'close', hideProgressOn = [] }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(Math.min(initialStep, steps.length - 1));
  const direction = useRef<1 | -1>(1);

  const next = useCallback(() => {
    direction.current = 1;
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    direction.current = -1;
    setIndex((i) => {
      if (i === 0) {
        onExit?.();
        return i;
      }
      return i - 1;
    });
  }, [onExit]);

  const goTo = useCallback(
    (key: string) => {
      const target = steps.findIndex((s) => s.key === key);
      if (target < 0) return;
      setIndex((i) => {
        direction.current = target >= i ? 1 : -1;
        return target;
      });
    },
    [steps]
  );

  // Android hardware back goes to the previous step instead of leaving onboarding.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [index, back]);

  const step = steps[index];
  const showChrome = !hideProgressOn.includes(step.key);
  const progressSteps = steps.filter((s) => !hideProgressOn.includes(s.key));
  const position = progressSteps.findIndex((s) => s.key === step.key);

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      {showChrome && (
        <Animated.View entering={enter.fade()} exiting={exit.fade()} style={styles.header}>
          <View style={styles.headerRow}>
            {index > 0 || onExit ? (
              <IconButton icon={index === 0 ? exitIcon : 'chevron-back'} label={index === 0 ? 'Exit' : 'Previous step'} onPress={back} />
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text variant="label" tone="tertiary" accessibilityLiveRegion="polite">
              Step {position + 1} of {progressSteps.length} · {step.label}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ProgressBar value={(position + 1) / progressSteps.length} />
        </Animated.View>
      )}
      <View style={styles.fill}>
        <Animated.View key={step.key} entering={enter.step(direction.current)} exiting={exit.step(direction.current)} style={StyleSheet.absoluteFill}>
          {step.render({ next, back, goTo, bottomInset: insets.bottom, stepIndex: index })}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md, gap: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
