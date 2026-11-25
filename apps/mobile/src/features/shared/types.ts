import type React from 'react';

/** Contract for a profile section used both as an onboarding step and as a standalone edit screen. */
export type SectionProps = {
  mode: 'onboarding' | 'edit';
  onDone: () => void;
  onSkip?: () => void;
  intro?: React.ReactNode;
  bottomInset?: number;
};

export const submitLabel = (mode: SectionProps['mode']) => (mode === 'onboarding' ? 'Continue' : 'Save changes');
