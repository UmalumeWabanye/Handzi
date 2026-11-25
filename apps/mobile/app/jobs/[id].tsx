import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useAcceptQuote, useCancelJob, useDeclineQuote, useJob, useJobQuotes } from '@/api/hooks';
import type { QuoteWithHandyman } from '@/api/types';
import { useStartChat } from '@/features/chat/useStartChat';
import { JobBody } from '@/features/jobs/JobBody';
import { QuoteCard } from '@/features/jobs/QuoteCard';
import { haptic } from '@/lib/haptics';
import { plural, rand } from '@/lib/format';
import { Banner, Button, Card, EmptyState, IconButton, Screen, ScreenHeader, Section, Sheet, Skeleton, Text, colors, enter, space, useToast } from '@/ui';

/** Client: one of my jobs, with the quotes handymen have sent. */
export default function ClientJobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = useJob(id);
  const quotes = useJobQuotes(id, !!job.data?.isOwner);
  const accept = useAcceptQuote();
  const decline = useDeclineQuote();
  const cancel = useCancelJob();
  const toast = useToast();
  const chat = useStartChat();
  const [confirming, setConfirming] = useState<QuoteWithHandyman | null>(null);

  const j = job.data;
  const list = quotes.data ?? [];
  const pending = list.filter((q) => q.status === 'pending');
  const lowest = pending.length > 1 ? Math.min(...pending.map((q) => q.amount)) : undefined;
  const hired = list.find((q) => q.status === 'accepted');

  const doAccept = async () => {
    if (!confirming) return;
    try {
      const res = await accept.mutateAsync(confirming._id);
      haptic.success();
      toast(`You hired ${confirming.handyman.firstName}`);
      setConfirming(null);
      const bookingId = (res as { booking?: { _id: string } }).booking?._id;
      if (bookingId) router.push({ pathname: '/booking/[id]', params: { id: bookingId } });
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const doDecline = (q: QuoteWithHandyman) =>
    Alert.alert(`Decline ${q.handyman.firstName}'s quote?`, "They'll be told you went with someone else.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => decline.mutateAsync(q._id).catch((e) => toast(errorMessage(e), 'error')),
      },
    ]);

  const doCancel = () =>
    Alert.alert('Cancel this job?', 'Handymen will no longer be able to quote, and pending quotes will be declined.', [
      { text: 'Keep job', style: 'cancel' },
      {
        text: 'Cancel job',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancel.mutateAsync(id);
            toast('Job cancelled', 'info');
          } catch (e) {
            toast(errorMessage(e), 'error');
          }
        },
      },
    ]);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title="Your job" right={j?.status === 'open' ? <IconButton icon="close-circle-outline" label="Cancel job" color={colors.danger} onPress={doCancel} /> : undefined} />}
      refreshing={quotes.isRefetching}
      onRefresh={() => {
        job.refetch();
        quotes.refetch();
      }}
    >
      {job.isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={220} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={120} />
        </View>
      ) : job.error || !j ? (
        <View style={{ gap: space.md }}>
          <Banner tone="danger" title="Couldn't load this job" message={job.error ? errorMessage(job.error) : undefined} />
          <Button title="Try again" variant="outline" onPress={() => job.refetch()} />
        </View>
      ) : (
        <JobBody job={j}>
          {j.status !== 'open' && j.status !== 'cancelled' && hired && (
            <Banner tone="success" title={`You hired ${hired.handyman.firstName} for ${rand(hired.amount)}`} message="Pay, track progress and confirm the job from your booking." icon="checkmark-circle">
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
          {j.status === 'cancelled' && <Banner tone="warning" title="Job cancelled" message="This job is no longer visible to handymen." />}

          <Section title="Quotes" subtitle={list.length ? `${plural(list.length, 'quote')} received` : undefined}>
            {quotes.isLoading ? (
              <Skeleton height={180} />
            ) : list.length ? (
              <View style={{ gap: space.md }}>
                {list.map((q, i) => (
                  <QuoteCard
                    key={q._id}
                    quote={q}
                    index={i}
                    canDecide={j.status === 'open'}
                    lowest={lowest != null && q.status === 'pending' && q.amount === lowest}
                    onViewProfile={() => router.push({ pathname: '/handyman/[id]', params: { id: q.handyman.userId } })}
                    onAccept={() => setConfirming(q)}
                    onDecline={() => doDecline(q)}
                    onMessage={() => chat.start(id, q.handyman.userId)}
                  />
                ))}
              </View>
            ) : (
              <Card>
                <EmptyState
                  compact
                  icon="hourglass-outline"
                  title={j.status === 'open' ? 'Waiting for quotes' : 'No quotes'}
                  text={j.status === 'open' ? "Verified handymen near you can see your job. Pull down to check for new quotes." : undefined}
                />
              </Card>
            )}
          </Section>
        </JobBody>
      )}

      <Sheet visible={!!confirming} onClose={() => setConfirming(null)} title={confirming ? `Hire ${confirming.handyman.firstName}?` : ''}>
        {confirming && (
          <Animated.View entering={enter.fade()} style={{ gap: space.md }}>
            <Card style={{ gap: space.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" tone="secondary">
                  Quote
                </Text>
                <Text variant="heading">{rand(confirming.amount)}</Text>
              </View>
              {confirming.estimatedDuration && (
                <Text variant="caption" tone="tertiary">
                  Estimated time: {confirming.estimatedDuration}
                </Text>
              )}
            </Card>
            <Text variant="body" tone="secondary">
              Other quotes on this job will be declined. Your payment will be held safely by Handzi and only released to {confirming.handyman.firstName} once you confirm the job is done.
            </Text>
            <Button title={`Hire ${confirming.handyman.firstName}`} icon="checkmark" onPress={doAccept} loading={accept.isPending} />
            <Button title="Not yet" variant="ghost" onPress={() => setConfirming(null)} />
          </Animated.View>
        )}
      </Sheet>
    </Screen>
  );
}
