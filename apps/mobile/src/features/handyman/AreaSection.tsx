import React, { useState } from 'react';
import { View } from 'react-native';
import { errorMessage } from '@/api/client';
import { useMyProfile, useUpdateProfile } from '@/api/hooks';
import type { GeoPoint } from '@/api/types';
import { Banner, Button, Chip, ChipGroup, FormBody, SwitchRow, Text, TextField, space, useToast } from '@/ui';
import { LocationPicker } from '../shared/LocationPicker';
import { SectionProps, submitLabel } from '../shared/types';

const RADII = [10, 25, 50, 100];

export function AreaSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const toast = useToast();
  const p = data?.profile;

  const [area, setArea] = useState<GeoPoint | undefined>(p?.serviceArea?.coordinates?.length ? p.serviceArea : undefined);
  const [radius, setRadius] = useState(p?.serviceRadiusKm ?? 25);
  const [rate, setRate] = useState(p?.hourlyRate ? String(p.hourlyRate) : '');
  const [callOut, setCallOut] = useState(p?.callOutFee ? String(p.callOutFee) : '');
  const [available, setAvailable] = useState(p?.available ?? true);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    area: !area ? 'Set the area you work from' : null,
    rate: !(Number(rate) > 0) ? 'Enter your hourly rate' : null,
  };

  const save = async () => {
    setTried(true);
    if (errors.area || errors.rate) return;
    setError(null);
    try {
      await update.mutateAsync({
        serviceArea: area,
        serviceRadiusKm: radius,
        hourlyRate: Number(rate),
        callOutFee: callOut ? Number(callOut) : 0,
        available,
      });
      if (mode === 'edit') toast('Service area & rates updated');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const digits = (set: (v: string) => void) => (t: string) => set(t.replace(/\D/g, '').slice(0, 6));

  return (
    <FormBody bottomInset={bottomInset} footer={<Button title={submitLabel(mode)} onPress={save} loading={update.isPending} />}>
      {intro}
      <Banner tone="danger" message={error} />
      <LocationPicker label="Where you work from" value={area} onChange={setArea} error={tried ? errors.area : null} />
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          How far will you travel?
        </Text>
        <ChipGroup>
          {RADII.map((r) => (
            <Chip key={r} label={`${r} km`} selected={radius === r} onPress={() => setRadius(r)} />
          ))}
        </ChipGroup>
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Hourly rate" prefix="R" value={rate} onChangeText={digits(setRate)} keyboardType="number-pad" placeholder="350" error={tried ? errors.rate : null} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Call-out fee" optional prefix="R" value={callOut} onChangeText={digits(setCallOut)} keyboardType="number-pad" placeholder="0" />
        </View>
      </View>
      <Text variant="caption" tone="tertiary">
        Rates are a guide for clients. You'll still quote a fixed price for each job.
      </Text>
      {mode === 'edit' && <SwitchRow label="Available for new work" hint="Turn off when you're fully booked" value={available} onChange={setAvailable} />}
    </FormBody>
  );
}
