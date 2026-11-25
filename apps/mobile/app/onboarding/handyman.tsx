import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import type { ChecklistKey } from '@handyconnect/shared';
import { useMyProfile } from '@/api/hooks';
import type { User } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { AreaSection } from '@/features/handyman/AreaSection';
import { BasicsSection } from '@/features/handyman/BasicsSection';
import { CertificationsSection, ExperienceSection, PortfolioSection } from '@/features/handyman/ListSections';
import { ReviewStep } from '@/features/handyman/ReviewStep';
import { TradesSection } from '@/features/handyman/TradesSection';
import { VerificationSection } from '@/features/handyman/VerificationSection';
import { Success } from '@/features/onboarding/Success';
import { Wizard, WizardStep } from '@/features/onboarding/Wizard';
import { Banner, Button, Screen, Skeleton, StepIntro } from '@/ui';

const ORDER: (ChecklistKey | 'review' | 'done')[] = ['basics', 'trades', 'experience', 'portfolio', 'certifications', 'area', 'verification', 'review', 'done'];

/** Handyman onboarding: build a LinkedIn/Upwork-style profile, verify ID, preview, publish. */
export default function HandymanOnboarding() {
  const { user, setUser, logout, switchMode } = useAuth();
  const profile = useMyProfile();
  const [published, setPublished] = useState<User | null>(null);

  // Resume at the first required section that isn't complete yet.
  const initialStep = useMemo(() => {
    if (!profile.data) return 0;
    const firstMissing = profile.data.checklist.find((i) => i.required && !i.done);
    return ORDER.indexOf(firstMissing ? firstMissing.key : 'review');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile.data]);

  if (profile.isLoading) {
    return (
      <Screen>
        <Skeleton height={8} />
        <Skeleton height={36} width="70%" />
        <Skeleton height={20} />
        <Skeleton height={220} />
      </Screen>
    );
  }
  if (profile.error || !profile.data) {
    return (
      <Screen contentStyle={{ justifyContent: 'center' }}>
        <Banner tone="danger" title="We couldn't load your profile" message="Check your connection and try again." />
        <Button title="Try again" onPress={() => profile.refetch()} />
      </Screen>
    );
  }

  const canGoBackToHiring = !!user?.onboarded.client;
  const exit = () =>
    Alert.alert(
      canGoBackToHiring ? 'Leave handyman setup?' : 'Log out?',
      'Your progress is saved. You can pick up where you left off.',
      [
        { text: 'Stay', style: 'cancel' },
        canGoBackToHiring
          ? { text: 'Back to hiring', onPress: () => switchMode('client') }
          : { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );

  const intro = (title: string, subtitle: string) => <StepIntro title={title} subtitle={subtitle} />;

  const steps: WizardStep[] = [
    {
      key: 'basics',
      label: 'About you',
      render: ({ next, bottomInset }) => (
        <BasicsSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro(`Let's build your profile, ${user?.firstName}`, 'Clients see this first when you quote on their job.')} />
      ),
    },
    {
      key: 'trades',
      label: 'Trades',
      render: ({ next, bottomInset }) => <TradesSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro('What do you do?', 'Pick your trades. Jobs in these categories will be shown to you.')} />,
    },
    {
      key: 'experience',
      label: 'Experience',
      render: ({ next, bottomInset }) => (
        <ExperienceSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro('Your work history', 'Where have you worked? Add your current role and any past jobs or apprenticeships.')} />
      ),
    },
    {
      key: 'portfolio',
      label: 'Proof of work',
      render: ({ next, bottomInset }) => (
        <PortfolioSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro('Show your work', 'Add photos of jobs you have completed. This is the most important part of your profile.')} />
      ),
    },
    {
      key: 'certifications',
      label: 'Certifications',
      render: ({ next, bottomInset }) => (
        <CertificationsSection mode="onboarding" onDone={next} onSkip={next} bottomInset={bottomInset} intro={intro('Licences & certificates', 'Optional, but registered and certified handymen win more jobs.')} />
      ),
    },
    {
      key: 'area',
      label: 'Area & rates',
      render: ({ next, bottomInset }) => <AreaSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro('Where and how much?', 'Set the area you cover and your usual rates.')} />,
    },
    {
      key: 'verification',
      label: 'Verify ID',
      render: ({ next, bottomInset }) => (
        <VerificationSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={intro('Verify your identity', 'Clients only hire handymen they can trust. This takes 2 minutes.')} />
      ),
    },
    {
      key: 'review',
      label: 'Review',
      render: ({ next, goTo, bottomInset }) => (
        <ReviewStep
          bottomInset={bottomInset}
          onJump={goTo}
          onPublished={(u) => {
            setPublished(u);
            next();
          }}
        />
      ),
    },
    {
      key: 'done',
      label: 'Done',
      render: () => (
        <View style={{ flex: 1 }}>
          <Success
            title="You're live!"
            message="Your profile is published. Clients will see it whenever you quote on their jobs."
            footnote={profile.data?.profile.verification.status === 'verified' ? undefined : "We'll let you know as soon as your ID is verified."}
            cta="Find work"
            onContinue={() => {
              // Applying the published user flips the guard; it takes over navigation into the handyman app.
              if (published) setUser(published);
              else router.replace('/find-work');
            }}
          />
        </View>
      ),
    },
  ];

  return <Wizard steps={steps} initialStep={initialStep} onExit={exit} exitIcon={canGoBackToHiring ? 'close' : 'log-out-outline'} hideProgressOn={['done']} />;
}
