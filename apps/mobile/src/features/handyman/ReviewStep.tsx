import React, { useState } from 'react';
import { errorMessage } from '@/api/client';
import { handymanApi } from '@/api/endpoints';
import { keys, useMyProfile } from '@/api/hooks';
import type { User } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { Banner, Button, FormBody, Skeleton, StepIntro, space } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { haptic } from '@/lib/haptics';
import { ProfileStrength } from './ProfileStrength';
import { ProfileView, toPublicShape } from './ProfileView';

type Props = { onPublished: (user: User) => void; onJump: (stepKey: string) => void; bottomInset?: number };

/** Final onboarding step: preview exactly what clients will see, then publish. */
export function ReviewStep({ onPublished, onJump, bottomInset }: Props) {
  const { user } = useAuth();
  const { data } = useMyProfile();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data || !user) return <Skeleton height={400} style={{ margin: space.xl }} />;
  const missing = data.checklist.filter((i) => i.required && !i.done);

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await handymanApi.completeOnboarding();
      qc.setQueryData(keys.myProfile, res);
      haptic.success();
      // The caller applies the new user after the celebration screen (that flips routing to the handyman app).
      onPublished(res.user);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormBody
      bottomInset={bottomInset}
      footer={<Button title="Publish my profile" icon="rocket-outline" onPress={publish} loading={busy} disabled={missing.length > 0} />}
    >
      <StepIntro title="Looking good!" subtitle="This is how clients will see your profile when you quote on their jobs." />
      <Banner tone="danger" message={error} />
      {missing.length > 0 && (
        <View style={{ gap: space.md }}>
          <Banner tone="warning" title="A few things left" message="Finish these to publish your profile." />
          <ProfileStrength checklist={data.checklist} showDone={false} onOpen={onJump} />
        </View>
      )}
      <ProfileView h={toPublicShape(data.profile, user)} pendingVerification={data.profile.verification.status === 'pending'} />
    </FormBody>
  );
}
