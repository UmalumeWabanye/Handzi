import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { useCategories } from '@/api/hooks';
import type { GeoPoint } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { AvatarPicker, Banner, Button, Chip, ChipGroup, FormBody, Skeleton, Text, enter, radius, space, useAccent, useToast } from '@/ui';
import { LocationPicker } from '../shared/LocationPicker';
import { SectionProps, submitLabel } from '../shared/types';

export function ClientPhotoSection({ onDone, onSkip, intro, bottomInset }: SectionProps) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  return (
    <FormBody
      bottomInset={bottomInset}
      footer={user?.avatar ? <Button title="Continue" onPress={onDone} /> : <Button title="Skip for now" variant="outline" onPress={onSkip ?? onDone} />}
    >
      {intro}
      <View style={{ paddingVertical: space.xl }}>
        <AvatarPicker
          size={132}
          uri={user?.avatar}
          name={`${user?.firstName} ${user?.lastName}`}
          caption="Handymen like to know who they're meeting"
          onChange={async (avatar) => {
            try {
              await updateUser({ avatar });
            } catch (e) {
              toast(errorMessage(e), 'error');
            }
          }}
        />
      </View>
    </FormBody>
  );
}

type LocationProps = SectionProps & { value?: GeoPoint; onChange?: (p: GeoPoint) => void };

export function ClientLocationSection({ mode, onDone, intro, bottomInset, value, onChange }: LocationProps) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [local, setLocal] = useState<GeoPoint | undefined>(value ?? user?.location);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setTried(true);
    if (!local) return;
    if (mode === 'onboarding') {
      onChange?.(local);
      onDone();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateUser({ location: local });
      toast('Location updated');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormBody bottomInset={bottomInset} footer={<Button title={submitLabel(mode)} onPress={save} loading={busy} />}>
      {intro}
      <Banner tone="danger" message={error} />
      <LocationPicker label="Home address or suburb" value={local} onChange={setLocal} error={tried && !local ? 'We need your area to show handymen nearby' : null} />
      <Text variant="caption" tone="tertiary">
        We only share your suburb with handymen. Your exact address is shared once you book.
      </Text>
    </FormBody>
  );
}

type InterestProps = SectionProps & { value?: string[]; onChange?: (ids: string[]) => void };

export function InterestsSection({ mode, onDone, onSkip, intro, bottomInset, value, onChange }: InterestProps) {
  const { user, updateUser } = useAuth();
  const categories = useCategories();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(value ?? user?.interests ?? []);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const save = async () => {
    if (mode === 'onboarding') {
      onChange?.(selected);
      onDone();
      return;
    }
    setBusy(true);
    try {
      await updateUser({ interests: selected });
      toast('Preferences updated');
      onDone();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormBody
      bottomInset={bottomInset}
      footer={
        <>
          <Button title={submitLabel(mode)} onPress={save} loading={busy} disabled={mode === 'onboarding' && !selected.length} />
          {mode === 'onboarding' && !selected.length && <Button title="Skip for now" variant="ghost" onPress={onSkip ?? onDone} />}
        </>
      }
    >
      {intro}
      {categories.isLoading ? (
        <Skeleton height={200} />
      ) : (
        <ChipGroup>
          {categories.data?.map((c) => (
            <Chip key={c._id} label={c.name} icon={c.icon as keyof typeof Ionicons.glyphMap} selected={selected.includes(c._id)} onPress={() => toggle(c._id)} />
          ))}
        </ChipGroup>
      )}
    </FormBody>
  );
}

const HOW = [
  { icon: 'create-outline', title: 'Post a job', text: 'Describe what needs fixing and add a few photos.' },
  { icon: 'people-outline', title: 'Compare quotes', text: 'Verified handymen nearby send prices. Check their profiles, work and reviews.' },
  { icon: 'lock-closed-outline', title: 'Pay safely', text: 'Your payment is held by Handzi and only released when the job is done.' },
] as const;

export function HowItWorks({ onFinish, busy, error, bottomInset, intro }: { onFinish: () => void; busy: boolean; error?: string | null; bottomInset?: number; intro?: React.ReactNode }) {
  const accent = useAccent();
  return (
    <FormBody bottomInset={bottomInset} footer={<Button title="Start exploring" iconRight="arrow-forward" onPress={onFinish} loading={busy} />}>
      {intro}
      <Banner tone="danger" message={error} />
      <View style={{ gap: space.md }}>
        {HOW.map((s, i) => (
          <Animated.View key={s.title} entering={enter.up(220 + i * 110)} style={styles.how}>
            <View style={[styles.howIcon, { backgroundColor: accent.softer }]}>
              <Ionicons name={s.icon} size={24} color={accent.main} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="overline" color={accent.main}>
                Step {i + 1}
              </Text>
              <Text variant="subheading">{s.title}</Text>
              <Text variant="body" tone="secondary">
                {s.text}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </FormBody>
  );
}

const styles = StyleSheet.create({
  how: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start', paddingVertical: space.sm },
  howIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
