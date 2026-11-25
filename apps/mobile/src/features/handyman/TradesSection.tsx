import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { useCategories, useMyProfile, useUpdateProfile } from '@/api/hooks';
import { Banner, Button, Chip, ChipGroup, FormBody, Skeleton, Text, TextField, enter, exit, layout, space, useToast } from '@/ui';
import { SectionProps, submitLabel } from '../shared/types';

const MAX_TRADES = 5;

export function TradesSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { data } = useMyProfile();
  const categories = useCategories();
  const update = useUpdateProfile();
  const toast = useToast();

  const [trades, setTrades] = useState<string[]>(data?.profile.trades.map((t) => t._id) ?? []);
  const [skills, setSkills] = useState<string[]>(data?.profile.skills ?? []);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const subs = (categories.data ?? []).filter((c) => trades.includes(c._id)).flatMap((c) => c.subcategories);
    return [...new Set(subs)].filter((s) => !skills.includes(s));
  }, [categories.data, trades, skills]);

  const toggleTrade = (id: string) =>
    setTrades((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_TRADES ? cur : [...cur, id]));

  const addCustom = () => {
    const s = custom.trim();
    if (s && !skills.some((x) => x.toLowerCase() === s.toLowerCase())) setSkills((cur) => [...cur, s]);
    setCustom('');
  };

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({ trades, skills });
      if (mode === 'edit') toast('Trades & skills updated');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <FormBody
      bottomInset={bottomInset}
      footer={<Button title={submitLabel(mode)} onPress={save} loading={update.isPending} disabled={!trades.length} />}
    >
      {intro}
      <Banner tone="danger" message={error} />
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Your trades · pick up to {MAX_TRADES}
        </Text>
        {categories.isLoading ? (
          <ChipGroup>
            {[90, 120, 80, 110, 100, 70].map((w, i) => (
              <Skeleton key={i} width={w} height={38} round />
            ))}
          </ChipGroup>
        ) : (
          <ChipGroup>
            {categories.data?.map((c) => (
              <Chip
                key={c._id}
                label={c.name}
                icon={c.icon as keyof typeof Ionicons.glyphMap}
                selected={trades.includes(c._id)}
                onPress={() => toggleTrade(c._id)}
              />
            ))}
          </ChipGroup>
        )}
      </View>

      {trades.length > 0 && (
        <Animated.View entering={enter.up()} layout={layout()} style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Text variant="heading">Skills</Text>
            <Text variant="caption" tone="tertiary">
              Specific services help clients find you. Tap to add.
            </Text>
          </View>
          {skills.length > 0 && (
            <ChipGroup>
              {skills.map((s) => (
                <Animated.View key={s} entering={enter.pop()} exiting={exit.pop()} layout={layout()}>
                  <Chip label={s} selected onRemove={() => setSkills((cur) => cur.filter((x) => x !== s))} />
                </Animated.View>
              ))}
            </ChipGroup>
          )}
          {suggestions.length > 0 && (
            <ChipGroup>
              {suggestions.map((s) => (
                <Animated.View key={s} entering={enter.fade()} exiting={exit.fade()} layout={layout()}>
                  <Chip label={s} icon="add" onPress={() => setSkills((cur) => [...cur, s])} />
                </Animated.View>
              ))}
            </ChipGroup>
          )}
          <TextField
            label="Add your own"
            value={custom}
            onChangeText={setCustom}
            placeholder="e.g. Solar geyser installs"
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={addCustom}
            blurOnSubmit={false}
            icon="add-circle-outline"
          />
        </Animated.View>
      )}
    </FormBody>
  );
}
