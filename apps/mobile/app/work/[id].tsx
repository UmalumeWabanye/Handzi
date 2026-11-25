import React from 'react';
import { Alert, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useJob, useMyProfile, useWithdrawQuote } from '@/api/hooks';
import { useStartChat } from '@/features/chat/useStartChat';
import { JobBody } from '@/features/jobs/JobBody';
import { dayLabel, plural, rand, timeAgo } from '@/lib/format';
import { QUOTE_STATUS_META } from '@/lib/jobMeta';
import { Badge, Banner, Button, Card, Screen, ScreenHeader, Section, Skeleton, Text, enter, space, useAccent, useToast } from '@/ui';

/** Handyman: a job I can quote on (or already have). */
export default function WorkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const job = useJob(id);
  const profile = useMyProfile();
  const withdraw = useWithdrawQuote();
  const toast = useToast();
  const chat = useStartChat();

  const j = job.data;
  const q = j?.myQuote && j.myQuote.status !== 'withdrawn' ? j.myQuote : null;
  const verified = profile.data?.profile.verification.status === 'verified';
  const canQuote = j?.status === 'open' && !q;

  const doWithdraw = () =>
    Alert.alert('Withdraw your quote?', 'The client will no longer see it. You can quote again while the job is open.', [
      { text: 'Keep quote', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await withdraw.mutateAsync(q!._id);
            toast('Quote withdrawn', 'info');
          } catch (e) {
            toast(errorMessage(e), 'error');
          }
        },
      },
    ]);

  const askButton = (
    <Button title={q ? 'Message' : 'Ask a question'} icon="chatbubble-ellipses-outline" variant="outline" size="md" loading={chat.busy} onPress={() => chat.start(id)} style={{ flex: 1 }} />
  );

  const footer = !j ? null : canQuote ? (
    verified ? (
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {askButton}
        <Button title="Send a quote" size="md" icon="pricetag-outline" onPress={() => router.push({ pathname: '/quote/[jobId]', params: { jobId: id } })} style={{ flex: 1.4 }} />
      </View>
    ) : (
      <>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {askButton}
          <Button title="Send a quote" size="md" icon="lock-closed-outline" disabled onPress={() => {}} style={{ flex: 1.4 }} />
        </View>
        <Text variant="caption" tone="tertiary" center>
          You can quote once your ID is verified.
        </Text>
      </>
    )
  ) : q?.status === 'pending' && j.status === 'open' ? (
    <>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title="Withdraw" variant="danger" size="md" onPress={doWithdraw} loading={withdraw.isPending} style={{ flex: 1 }} />
        <Button title="Edit quote" size="md" icon="create-outline" onPress={() => router.push({ pathname: '/quote/[jobId]', params: { jobId: id } })} style={{ flex: 1.4 }} />
      </View>
      <View style={{ flexDirection: 'row' }}>{askButton}</View>
    </>
  ) : q ? (
    <View style={{ flexDirection: 'row' }}>{askButton}</View>
  ) : null;

  return (
    <Screen edges={['top', 'bottom']} header={<ScreenHeader title="Job" />} footer={footer} refreshing={job.isRefetching} onRefresh={() => job.refetch()}>
      {job.isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={220} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={120} />
        </View>
      ) : job.error || !j ? (
        <View style={{ gap: space.md }}>
          <Banner tone="danger" title="This job isn't available" message={job.error ? errorMessage(job.error) : 'It may have been filled or cancelled.'} />
          <Button title="Back to jobs" variant="outline" onPress={() => router.back()} />
        </View>
      ) : (
        <JobBody job={j}>
          {j.status === 'open' && !q && (
            <Text variant="caption" tone="tertiary">
              {j.quoteCount ? `${plural(j.quoteCount, 'handyman has', 'handymen have')} quoted so far.` : 'No quotes yet. Be the first!'}
            </Text>
          )}
          {q && (
            <Animated.View entering={enter.up(200)}>
              <Section title="Your quote">
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="title" color={accent.dark}>
                      {rand(q.amount)}
                    </Text>
                    <Badge label={QUOTE_STATUS_META[q.status].label} tone={QUOTE_STATUS_META[q.status].tone} icon={QUOTE_STATUS_META[q.status].icon} />
                  </View>
                  <Text variant="caption" tone="tertiary">
                    {[q.estimatedDuration, q.availableFrom && `can start ${dayLabel(q.availableFrom)}`, `sent ${timeAgo(q.createdAt)}`].filter(Boolean).join(' · ')}
                  </Text>
                  {q.message ? (
                    <Text variant="body" tone="secondary">
                      “{q.message}”
                    </Text>
                  ) : null}
                </Card>
              </Section>
              {q.status === 'accepted' && (
                <Banner tone="success" title="You got the job!" message="Track payment, start and finish the job from your booking." icon="trophy-outline">
                  {j.bookingId && (
                    <Button
                      title="View booking"
                      size="md"
                      iconRight="arrow-forward"
                      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: j.bookingId! } })}
                      style={{ marginTop: space.sm, alignSelf: 'flex-start' }}
                    />
                  )}
                </Banner>
              )}
            </Animated.View>
          )}
        </JobBody>
      )}
    </Screen>
  );
}
