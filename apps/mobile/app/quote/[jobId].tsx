import React, { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUOTE_DURATIONS, QUOTE_MESSAGE_MIN } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useJob, usePublicSettings, useSaveQuote } from '@/api/hooks';
import type { Job } from '@/api/types';
import { haptic } from '@/lib/haptics';
import { budgetLabel, rand } from '@/lib/format';
import { Banner, Button, Card, Chip, ChipGroup, DayPicker, FormBody, ScreenHeader, Skeleton, Text, TextField, colors, enter, fonts, layout, space, useAccent, useToast } from '@/ui';

const MIN_AMOUNT = 50;

function QuoteForm({ job }: { job: Job }) {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const settings = usePublicSettings();
  const save = useSaveQuote();
  const toast = useToast();
  const existing = job.myQuote && job.myQuote.status === 'pending' ? job.myQuote : null;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [duration, setDuration] = useState<string | undefined>(existing?.estimatedDuration);
  const [start, setStart] = useState<string | null>(existing?.availableFrom ?? null);
  const [message, setMessage] = useState(existing?.message ?? '');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount) || 0;
  const fee = settings.data ? Math.round(value * settings.data.commissionPercent) / 100 : null;
  const errors = {
    amount: value < MIN_AMOUNT ? `Enter a price of at least ${rand(MIN_AMOUNT)}` : null,
    message: message.trim().length < QUOTE_MESSAGE_MIN ? 'Tell the client what your price includes' : null,
  };

  const submit = async () => {
    setTried(true);
    if (errors.amount || errors.message) return;
    setError(null);
    try {
      await save.mutateAsync({
        jobId: job._id,
        quoteId: existing?._id,
        input: { amount: value, message: message.trim(), estimatedDuration: duration, availableFrom: start },
      });
      haptic.success();
      toast(existing ? 'Quote updated' : `Quote sent to ${job.client?.firstName ?? 'the client'}`);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <FormBody
      bottomInset={insets.bottom}
      footer={<Button title={existing ? 'Update quote' : 'Send quote'} icon="paper-plane-outline" onPress={submit} loading={save.isPending} />}
    >
      <Banner tone="danger" message={error} />
      <Card style={{ gap: 4 }}>
        <Text variant="caption" tone="tertiary">
          Quoting on
        </Text>
        <Text variant="bodyStrong">{job.title}</Text>
        <Text variant="caption" tone="tertiary">
          Client's budget: {budgetLabel(job.budget)}
        </Text>
      </Card>

      <View style={{ gap: space.sm }}>
        <TextField
          label="Your price for the whole job"
          prefix="R"
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/\D/g, '').slice(0, 7))}
          keyboardType="number-pad"
          placeholder="0"
          style={{ fontSize: 22, fontFamily: fonts.display }}
          error={tried ? errors.amount : null}
          hint="Include labour, materials and call-out."
        />
        {value >= MIN_AMOUNT && fee != null && (
          <Animated.View entering={enter.up(0, 6)} layout={layout()}>
            <Card style={{ gap: space.xs, backgroundColor: accent.soft, borderColor: accent.soft }}>
              <Row label="Client pays" value={rand(value)} />
              <Row label={`Handzi fee (${settings.data?.commissionPercent}%)`} value={`−${rand(fee)}`} muted />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
              <Row label="You receive" value={rand(value - fee)} strong />
            </Card>
          </Animated.View>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          How long will it take?
        </Text>
        <ChipGroup>
          {QUOTE_DURATIONS.map((d) => (
            <Chip key={d} label={d} selected={duration === d} onPress={() => setDuration(duration === d ? undefined : d)} />
          ))}
        </ChipGroup>
      </View>

      <DayPicker label="When can you start?" optional value={start} onChange={setStart} />

      <TextField
        label="Message to the client"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={2000}
        minLength={QUOTE_MESSAGE_MIN}
        placeholder="What's included in your price? How will you approach the job? Any questions about the problem?"
        error={tried ? errors.message : null}
      />
    </FormBody>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={muted ? 'tertiary' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} tone={muted ? 'tertiary' : 'primary'}>
        {value}
      </Text>
    </View>
  );
}

/** Handyman: send (or edit) a quote on a job. */
export default function QuoteScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = useJob(jobId);
  const editing = job.data?.myQuote?.status === 'pending';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScreenHeader close title={editing ? 'Edit your quote' : 'Send a quote'} />
      {job.data ? (
        <QuoteForm job={job.data} />
      ) : (
        <View style={{ padding: space.xl, gap: space.lg }}>
          {job.error ? <Banner tone="danger" message={errorMessage(job.error)} /> : <Skeleton height={300} />}
        </View>
      )}
    </SafeAreaView>
  );
}
