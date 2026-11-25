import React, { useState } from 'react';
import { Alert } from 'react-native';
import { errorMessage } from '@/api/client';
import type { GeoPoint } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { ClientLocationSection, ClientPhotoSection, HowItWorks, InterestsSection } from '@/features/client/ClientSections';
import { Wizard, WizardStep } from '@/features/onboarding/Wizard';
import { haptic } from '@/lib/haptics';
import { StepIntro } from '@/ui';

/** Client onboarding: photo, home area, what they need help with, how Handzi works. */
export default function ClientOnboarding() {
  const { user, completeClientOnboarding, logout, switchMode } = useAuth();
  const [location, setLocation] = useState<GeoPoint | undefined>(user?.location);
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (goTo: (k: string) => void) => {
    if (!location) return goTo('location');
    setBusy(true);
    setError(null);
    try {
      await completeClientOnboarding({ location, interests }); // the guard moves on to the client app
      haptic.success();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canGoBackToWork = !!user?.onboarded.handyman;
  const exit = () =>
    Alert.alert(canGoBackToWork ? 'Leave setup?' : 'Log out?', undefined, [
      { text: 'Stay', style: 'cancel' },
      canGoBackToWork
        ? { text: 'Back to handyman mode', onPress: () => switchMode('handyman') }
        : { text: 'Log out', style: 'destructive', onPress: logout },
    ]);

  const steps: WizardStep[] = [
    {
      key: 'photo',
      label: 'Profile',
      render: ({ next, bottomInset }) => (
        <ClientPhotoSection mode="onboarding" onDone={next} bottomInset={bottomInset} intro={<StepIntro title={`Welcome, ${user?.firstName}!`} subtitle="Add a profile photo so handymen know who to expect." />} />
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: ({ next, bottomInset }) => (
        <ClientLocationSection
          mode="onboarding"
          value={location}
          onChange={setLocation}
          onDone={next}
          bottomInset={bottomInset}
          intro={<StepIntro title="Where's home?" subtitle="We'll show you handymen who work in your area." />}
        />
      ),
    },
    {
      key: 'interests',
      label: 'Interests',
      render: ({ next, bottomInset }) => (
        <InterestsSection
          mode="onboarding"
          value={interests}
          onChange={setInterests}
          onDone={next}
          onSkip={next}
          bottomInset={bottomInset}
          intro={<StepIntro title="What do you usually need help with?" subtitle="Pick a few. We'll put these trades first for you." />}
        />
      ),
    },
    {
      key: 'how',
      label: 'How it works',
      render: ({ goTo, bottomInset }) => (
        <HowItWorks bottomInset={bottomInset} busy={busy} error={error} onFinish={() => finish(goTo)} intro={<StepIntro title="How Handzi works" subtitle="Hiring help, without the guesswork." />} />
      ),
    },
  ];

  return <Wizard steps={steps} onExit={exit} exitIcon={canGoBackToWork ? 'close' : 'log-out-outline'} />;
}
