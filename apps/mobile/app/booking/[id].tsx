import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useBooking, useBookingAction, useCancelBooking, useDisputeBooking } from '@/api/hooks';
import type { BookingDetail } from '@/api/types';
import { BookingTimeline } from '@/features/bookings/BookingTimeline';
import { MockCheckout } from '@/features/bookings/MockCheckout';
import { ReviewForm } from '@/features/bookings/ReviewForm';
import { useStartChat } from '@/features/chat/useStartChat';
import { haptic } from '@/lib/haptics';
import { dayLabel, placeLabel, rand, timeAgo } from '@/lib/format';
import { BOOKING_META, PAYMENT_META } from '@/lib/jobMeta';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  DetailRow,
  Screen,
  ScreenHeader,
  Section,
  Sheet,
  Skeleton,
  StarRating,
  Text,
  TextField,
  colors,
  enter,
  space,
  useAccent,
  useToast,
} from '@/ui';

function Money({ b }: { b: BookingDetail }) {
  const Row = ({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={muted ? 'tertiary' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={muted ? 'tertiary' : 'primary'}>
        {value}
      </Text>
    </View>
  );
  const pay = b.payment ? PAYMENT_META[b.payment.status] : PAYMENT_META.pending;
  return (
    <Card style={{ gap: space.sm }}>
      {b.role === 'client' ? (
        <Row label="Total" value={rand(b.amount)} strong />
      ) : (
        <>
          <Row label="Job price" value={rand(b.amount)} />
          <Row label={`Handzi fee (${b.commissionPercent}%)`} value={`−${rand(b.commissionAmount)}`} muted />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Row label="You receive" value={rand(b.handymanPayout)} strong />
        </>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
        <Badge label={pay.label} tone={pay.tone} icon={pay.icon} />
        {b.provider === 'mock' && b.payment && <Badge label="Test" tone="neutral" icon="flask-outline" />}
      </View>
    </Card>
  );
}

/** One booking, for either side: status, timeline, money, and the next action. */
export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = useAccent();
  const toast = useToast();
  const q = useBooking(id);
  const action = useBookingAction();
  const cancel = useCancelBooking();
  const dispute = useDisputeBooking();
  const chat = useStartChat();
  const [checkout, setCheckout] = useState(false);
  const [problem, setProblem] = useState(false);
  const [reason, setReason] = useState('');

  const b = q.data;
  const meta = b ? BOOKING_META[b.status] : null;

  const run = async (act: 'start' | 'complete' | 'confirm', success: string) => {
    try {
      await action.mutateAsync({ id, action: act });
      haptic.success();
      toast(success);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const confirmAction = (title: string, message: string, act: 'start' | 'complete' | 'confirm', success: string) =>
    Alert.alert(title, message, [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes', onPress: () => run(act, success) },
    ]);

  const doCancel = () =>
    Alert.alert('Cancel this booking?', b?.payment?.status === 'held' ? 'The client will be refunded in full.' : undefined, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () => cancel.mutateAsync({ id }).then(() => toast('Booking cancelled', 'info'), (e) => toast(errorMessage(e), 'error')),
      },
    ]);

  const sendDispute = async () => {
    try {
      await dispute.mutateAsync({ id, reason: reason.trim() });
      setProblem(false);
      toast('Thanks. Our team will be in touch', 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const footer = !b ? null : (() => {
    const busy = action.isPending;
    if (b.role === 'client') {
      if (b.status === 'awaiting_payment')
        return (
          <>
            <Button title={`Pay ${rand(b.amount)}`} icon="lock-closed" onPress={() => setCheckout(true)} />
            <Button title="Cancel booking" variant="ghost" size="md" onPress={doCancel} />
          </>
        );
      if (b.status === 'funded') return <Button title="Cancel booking" variant="danger" size="md" onPress={doCancel} />;
      if (b.status === 'in_progress') return <Button title="Report a problem" variant="outline" size="md" icon="alert-circle-outline" onPress={() => setProblem(true)} />;
      if (b.status === 'completed')
        return (
          <>
            <Button
              title="Confirm job is done"
              icon="checkmark-circle"
              loading={busy}
              onPress={() => confirmAction('Is the job done to your satisfaction?', `${rand(b.amount)} will be released to ${b.other.firstName}.`, 'confirm', 'Job confirmed')}
            />
            <Button title="Report a problem" variant="ghost" size="md" onPress={() => setProblem(true)} />
          </>
        );
    } else {
      if (b.status === 'funded')
        return (
          <>
            <Button title="Start job" icon="play" loading={busy} onPress={() => confirmAction('Start the job now?', 'The client will be told you have started.', 'start', 'Job started')} />
            <Button title="Cancel booking" variant="ghost" size="md" onPress={doCancel} />
          </>
        );
      if (b.status === 'in_progress')
        return (
          <Button
            title="Mark job as done"
            icon="checkmark-done"
            loading={busy}
            onPress={() => confirmAction('Is the job finished?', 'The client will be asked to check the work and confirm.', 'complete', 'Marked as done')}
          />
        );
      if (b.status === 'awaiting_payment') return <Button title="Cancel booking" variant="ghost" size="md" onPress={doCancel} />;
    }
    return null;
  })();

  return (
    <Screen edges={['top', 'bottom']} header={<ScreenHeader title="Booking" />} footer={footer} refreshing={q.isRefetching} onRefresh={q.refetch}>
      {q.isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={120} />
          <Skeleton height={200} />
        </View>
      ) : q.error || !b || !meta ? (
        <Banner tone="danger" title="Couldn't load this booking" message={q.error ? errorMessage(q.error) : undefined} />
      ) : (
        <>
          <Animated.View entering={enter.up()} style={{ gap: space.sm }}>
            <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
            <Text variant="title">{b.role === 'client' ? meta.client : meta.handyman}</Text>
            <Text variant="body" tone="secondary">
              {b.title}
            </Text>
          </Animated.View>

          {b.status === 'completed' && b.role === 'client' && b.timeline.autoConfirmAt && (
            <Banner tone="warning" message={`If you don't confirm or report a problem, the job is confirmed automatically ${timeAgo(b.timeline.autoConfirmAt).replace(' ago', '') === 'just now' ? 'soon' : `on ${dayLabel(b.timeline.autoConfirmAt)}`}.`} />
          )}
          {b.status === 'disputed' && b.dispute && <Banner tone="danger" title="Problem reported" message={`"${b.dispute.reason}" — the payment is on hold while our team reviews it.`} />}
          {b.status === 'cancelled' && <Banner tone="info" message={b.payment?.status === 'refunded' ? 'This booking was cancelled and the payment refunded in full.' : 'This booking was cancelled.'} />}

          <Animated.View entering={enter.up(60)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar uri={b.other.avatar} name={`${b.other.firstName} ${b.other.lastName}`} size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {b.other.firstName} {b.other.lastName}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {b.role === 'client' ? 'Your handyman' : 'Your client'}
                </Text>
              </View>
              {b.job && (
                <Button title="Message" size="md" variant="secondary" icon="chatbubble-ellipses-outline" loading={chat.busy} onPress={() => chat.start(b.job!._id, b.role === 'client' ? b.other.id : undefined)} />
              )}
            </Card>
          </Animated.View>

          <Animated.View entering={enter.up(100)}>
            <Card style={{ gap: space.xs }}>
              <DetailRow icon="location-outline" label="Address" value={b.address || (b.role === 'handyman' ? `${placeLabel(b.place)} · shared once paid` : placeLabel(b.place) || '—')} />
              <DetailRow icon="calendar-outline" label="Date" value={b.scheduledFor ? dayLabel(b.scheduledFor) : 'To be arranged in chat'} />
              {b.job && (
                <Button
                  title="View job details"
                  variant="ghost"
                  size="md"
                  iconRight="chevron-forward"
                  onPress={() => router.push(b.role === 'client' ? { pathname: '/jobs/[id]', params: { id: b.job!._id } } : { pathname: '/work/[id]', params: { id: b.job!._id } })}
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
                />
              )}
            </Card>
          </Animated.View>

          <Section title="Payment">
            <Money b={b} />
          </Section>

          {b.status !== 'cancelled' && (
            <Section title="Progress">
              <Card>
                <BookingTimeline booking={b} />
              </Card>
            </Section>
          )}

          {b.status === 'confirmed' && (
            <Section title="Review">
              {b.canReview ? (
                <ReviewForm booking={b} />
              ) : b.myReview ? (
                <Card style={{ gap: space.sm }}>
                  <Text variant="caption" tone="tertiary">
                    You rated {b.other.firstName}
                  </Text>
                  <StarRating value={b.myReview.rating} />
                  {b.myReview.text ? (
                    <Text variant="body" tone="secondary">
                      “{b.myReview.text}”
                    </Text>
                  ) : null}
                </Card>
              ) : null}
              {b.theirReview && (
                <Card style={{ gap: space.sm, backgroundColor: accent.soft, borderColor: accent.soft }}>
                  <Text variant="caption" tone="tertiary">
                    {b.other.firstName} rated you
                  </Text>
                  <StarRating value={b.theirReview.rating} />
                  {b.theirReview.text ? (
                    <Text variant="body" tone="secondary">
                      “{b.theirReview.text}”
                    </Text>
                  ) : null}
                </Card>
              )}
            </Section>
          )}

          <MockCheckout booking={b} visible={checkout} onClose={() => setCheckout(false)} onPaid={() => setCheckout(false)} />
          <Sheet visible={problem} onClose={() => setProblem(false)} title="Report a problem">
            <Text variant="body" tone="secondary">
              We'll hold the payment while our team looks into it. {b.other.firstName} will be told a problem was reported.
            </Text>
            <TextField label="What went wrong?" multiline value={reason} onChangeText={setReason} minLength={10} maxLength={2000} placeholder="Describe the issue so we can help" />
            <Button title="Submit" variant="danger" onPress={sendDispute} loading={dispute.isPending} disabled={reason.trim().length < 10} />
          </Sheet>
        </>
      )}
    </Screen>
  );
}
