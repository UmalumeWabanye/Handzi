import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClientLocationSection, InterestsSection } from '@/features/client/ClientSections';
import { AreaSection } from '@/features/handyman/AreaSection';
import { BasicsSection } from '@/features/handyman/BasicsSection';
import { CertificationsSection, ExperienceSection, PortfolioSection } from '@/features/handyman/ListSections';
import { TradesSection } from '@/features/handyman/TradesSection';
import { VerificationSection } from '@/features/handyman/VerificationSection';
import type { SectionProps } from '@/features/shared/types';
import { withProfileLoaded } from '@/features/handyman/EditorShell';
import { EmptyState, ScreenHeader, colors } from '@/ui';

const SECTIONS: Record<string, { title: string; Component: React.ComponentType<SectionProps> }> = {
  basics: { title: 'About you', Component: withProfileLoaded(BasicsSection, { chrome: false }) },
  trades: { title: 'Trades & skills', Component: withProfileLoaded(TradesSection, { chrome: false }) },
  experience: { title: 'Experience', Component: ExperienceSection },
  portfolio: { title: 'Proof of work', Component: PortfolioSection },
  certifications: { title: 'Certifications', Component: CertificationsSection },
  area: { title: 'Area & rates', Component: withProfileLoaded(AreaSection, { chrome: false }) },
  verification: { title: 'ID verification', Component: withProfileLoaded(VerificationSection, { chrome: false }) },
  location: { title: 'Home area', Component: ClientLocationSection },
  interests: { title: 'Interests', Component: InterestsSection },
};

/** Edit any single profile section, reusing the same component as onboarding. */
export default function EditSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const insets = useSafeAreaInsets();
  const entry = SECTIONS[section];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScreenHeader title={entry?.title ?? ''} />
      {entry ? <entry.Component mode="edit" onDone={() => router.back()} bottomInset={insets.bottom} /> : <EmptyState icon="alert-circle-outline" title="Nothing to edit here" />}
    </SafeAreaView>
  );
}
