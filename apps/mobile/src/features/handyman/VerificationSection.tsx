import React, { useState } from 'react';
import { View } from 'react-native';
import { errorMessage } from '@/api/client';
import { useMyProfile, useSubmitVerification } from '@/api/hooks';
import { Banner, Button, Card, DocumentPicker, FormBody, ListRow, Text, space, useToast } from '@/ui';
import { SectionProps } from '../shared/types';

export function VerificationSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { data } = useMyProfile();
  const submit = useSubmitVerification();
  const toast = useToast();
  const v = data?.profile.verification;
  const status = v?.status ?? 'none';

  const [resubmitting, setResubmitting] = useState(status === 'none' || status === 'rejected');
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!idDoc || !selfie) return;
    setError(null);
    try {
      await submit.mutateAsync({ idDocumentUrl: idDoc, selfieUrl: selfie });
      toast('Documents submitted for review');
      setResubmitting(false);
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const continueLabel = mode === 'onboarding' ? 'Continue' : 'Done';

  return (
    <FormBody
      bottomInset={bottomInset}
      footer={
        resubmitting ? (
          <Button title="Submit for verification" icon="shield-checkmark-outline" onPress={send} loading={submit.isPending} disabled={!idDoc || !selfie} />
        ) : (
          <Button title={continueLabel} onPress={onDone} />
        )
      }
    >
      {intro}
      <Banner tone="danger" message={error} />
      {status === 'verified' && <Banner tone="success" title="You're verified" message="Your profile shows the verified badge to clients." icon="shield-checkmark" />}
      {status === 'pending' && !resubmitting && (
        <Banner tone="warning" title="Under review" message="Our team usually reviews documents within 1 business day. You can finish setting up in the meantime." />
      )}
      {status === 'rejected' && (
        <Banner tone="danger" title="We couldn't verify your documents" message={v?.rejectionReason || 'Please upload clearer photos and try again.'} />
      )}

      {resubmitting ? (
        <>
          <View style={{ gap: space.md }}>
            <DocumentPicker
              kind="id_document"
              label="South African ID or passport"
              hint="Photo of the page or card with your photo"
              icon="card-outline"
              value={idDoc}
              onChange={setIdDoc}
            />
            <DocumentPicker kind="selfie" label="Selfie" hint="A clear photo of your face, no hat or sunglasses" icon="person-circle-outline" value={selfie} onChange={setSelfie} frontCamera />
          </View>
          <Card style={{ gap: space.xs }}>
            <ListRow icon="lock-closed-outline" title="Kept private" subtitle="Only the Handzi verification team can see these documents." />
            <ListRow icon="shield-checkmark-outline" title="Builds trust" subtitle="Verified handymen are shown first and get more replies to their quotes." />
          </Card>
        </>
      ) : (
        status === 'pending' && (
          <Button title="Replace documents" variant="outline" onPress={() => setResubmitting(true)} />
        )
      )}
      {mode === 'onboarding' && status !== 'verified' && (
        <Text variant="caption" tone="tertiary">
          You can publish your profile while we review, but you'll need to be verified before you can send quotes.
        </Text>
      )}
    </FormBody>
  );
}
