import React, { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PricingType } from '@handyconnect/shared';
import { PORTFOLIO_MAX_PHOTOS, SERVICE_DESCRIPTION_MIN, SERVICE_MAX_TIERS } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useCategories, useDeleteService, useMyProfile, useMyServices, useSaveService } from '@/api/hooks';
import { EditorShell } from '@/features/handyman/EditorShell';
import { AddTile } from '@/features/handyman/ProfileBlocks';
import { rand } from '@/lib/format';
import {
  Button,
  Card,
  Chip,
  ChipGroup,
  IconButton,
  OptionCard,
  PhotoGrid,
  Skeleton,
  SwitchRow,
  Text,
  TextField,
  colors,
  enter,
  exit,
  layout,
  space,
  useToast,
} from '@/ui';

type TierDraft = { key: string; name: string; price: string; hours: string; description: string };

const PRICING: { value: PricingType; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'fixed', title: 'Fixed-price packages', subtitle: 'Up to 3 options, e.g. Basic, Standard and Premium', icon: 'pricetags-outline' },
  { value: 'hourly', title: 'Hourly rate', subtitle: 'Clients book an estimated number of hours', icon: 'time-outline' },
  { value: 'quote', title: 'Quote on request', subtitle: 'Clients post a job and you quote after seeing it', icon: 'chatbubble-ellipses-outline' },
];
const DEFAULT_NAMES = ['Basic', 'Standard', 'Premium'];
const newKey = () => Math.random().toString(36).slice(2);
const digits = (t: string, max = 7) => t.replace(/[^\d]/g, '').slice(0, max);

function ServiceEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const services = useMyServices();
  const profile = useMyProfile();
  const categories = useCategories();
  const save = useSaveService();
  const remove = useDeleteService();
  const toast = useToast();
  const existing = services.data?.services.find((s) => s._id === id);

  const myTrades = profile.data?.profile.trades.map((t) => t._id) ?? [];
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState<string | undefined>(existing?.category._id ?? myTrades[0]);
  const [subcategory, setSubcategory] = useState<string | undefined>(existing?.subcategory);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [pricingType, setPricingType] = useState<PricingType>(existing?.pricingType ?? 'fixed');
  const [tiers, setTiers] = useState<TierDraft[]>(
    existing?.tiers.length
      ? existing.tiers.map((t) => ({ key: t._id, name: t.name, price: String(t.price), hours: t.estimatedHours ? String(t.estimatedHours) : '', description: t.description ?? '' }))
      : [{ key: newKey(), name: 'Basic', price: '', hours: '', description: '' }]
  );
  const [active, setActive] = useState(existing?.active ?? true);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trades = [...(categories.data ?? [])].sort((a, b) => Number(myTrades.includes(b._id)) - Number(myTrades.includes(a._id)));
  const trade = categories.data?.find((c) => c._id === category);

  const setTier = (key: string, patch: Partial<TierDraft>) => setTiers((all) => all.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const choosePricing = (p: PricingType) => {
    setPricingType(p);
    if (p === 'hourly' && tiers.length === 1 && tiers[0].name === 'Basic') setTier(tiers[0].key, { name: 'Per hour', hours: tiers[0].hours || '1' });
    if (p === 'fixed' && tiers.length === 1 && tiers[0].name === 'Per hour') setTier(tiers[0].key, { name: 'Basic' });
  };

  const needsTiers = pricingType !== 'quote';
  const tierError = (t: TierDraft) =>
    !t.name.trim() ? 'Name this package' : !(Number(t.price) >= 50) ? 'Price must be at least R50' : pricingType === 'hourly' && !(Number(t.hours) > 0) ? 'Add estimated hours' : null;
  const errors = {
    title: title.trim().length < 5 ? 'Give the service a short title' : null,
    category: !category ? 'Pick a trade' : null,
    description: description.trim().length < SERVICE_DESCRIPTION_MIN ? "Describe what's included" : null,
    tiers: needsTiers && tiers.some((t) => tierError(t)),
  };

  const submit = async () => {
    setTried(true);
    if (errors.title || errors.category || errors.description || errors.tiers) {
      setError('Check the highlighted fields.');
      return;
    }
    setError(null);
    try {
      await save.mutateAsync({
        id,
        input: {
          category: category!,
          subcategory: subcategory ?? null,
          title: title.trim(),
          description: description.trim(),
          photos,
          pricingType,
          tiers: needsTiers
            ? tiers.map((t) => ({ name: t.name.trim(), price: Number(t.price), description: t.description.trim() || undefined, estimatedHours: t.hours ? Number(t.hours) : undefined }))
            : [],
          active,
        },
      });
      toast(id ? 'Service updated' : 'Service added');
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <EditorShell
      title={id ? 'Edit service' : 'Add a service'}
      onSave={submit}
      saving={save.isPending}
      error={error}
      onDelete={id ? () => remove.mutateAsync(id) : undefined}
      deleteLabel="this service"
    >
      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Photos (optional)
        </Text>
        <PhotoGrid value={photos} onChange={setPhotos} max={PORTFOLIO_MAX_PHOTOS} />
        <Text variant="caption" tone="secondary">
          Show finished examples of this service. The first photo is the cover.
        </Text>
      </View>

      <TextField label="Service title" value={title} onChangeText={setTitle} placeholder="e.g. Geyser replacement" maxLength={100} error={tried ? errors.title : null} />

      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Trade
        </Text>
        <ChipGroup>
          {trades.map((c) => (
            <Chip
              key={c._id}
              label={c.name}
              icon={c.icon as keyof typeof Ionicons.glyphMap}
              selected={category === c._id}
              onPress={() => {
                setCategory(c._id);
                setSubcategory(undefined);
              }}
            />
          ))}
        </ChipGroup>
        {tried && errors.category && (
          <Text variant="caption" tone="danger">
            {errors.category}
          </Text>
        )}
      </View>
      {trade && trade.subcategories.length > 0 && (
        <Animated.View key={trade._id} entering={enter.up()} style={{ gap: space.sm }}>
          <Text variant="label" tone="secondary">
            Type of work (optional)
          </Text>
          <ChipGroup>
            {trade.subcategories.map((s) => (
              <Chip key={s} label={s} selected={subcategory === s} onPress={() => setSubcategory(subcategory === s ? undefined : s)} />
            ))}
          </ChipGroup>
        </Animated.View>
      )}

      <TextField
        label="What's included?"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={3000}
        minLength={SERVICE_DESCRIPTION_MIN}
        placeholder="What you do, what's included in the price, and anything the client should prepare."
        error={tried ? errors.description : null}
      />

      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          How do you price it?
        </Text>
        {PRICING.map((p) => (
          <OptionCard key={p.value} title={p.title} subtitle={p.subtitle} icon={p.icon} selected={pricingType === p.value} onPress={() => choosePricing(p.value)} />
        ))}
      </View>

      {needsTiers && (
        <Animated.View layout={layout()} style={{ gap: space.md }}>
          <Text variant="heading">{pricingType === 'hourly' ? 'Your rate' : 'Packages'}</Text>
          {tiers.map((t, i) => {
            const err = tried ? tierError(t) : null;
            const total = pricingType === 'hourly' && Number(t.price) > 0 && Number(t.hours) > 0 ? Number(t.price) * Number(t.hours) : null;
            return (
              <Animated.View key={t.key} entering={enter.pop()} exiting={exit.pop()} layout={layout()}>
                <Card style={{ gap: space.md, borderColor: err ? colors.danger : colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="overline" tone="secondary">
                      {pricingType === 'hourly' ? 'Hourly rate' : `Package ${i + 1}`}
                    </Text>
                    {tiers.length > 1 && (
                      <IconButton icon="trash-outline" label={`Remove ${t.name || `package ${i + 1}`}`} color={colors.danger} onPress={() => setTiers((all) => all.filter((x) => x.key !== t.key))} />
                    )}
                  </View>
                  <TextField label="Name" value={t.name} onChangeText={(v) => setTier(t.key, { name: v })} maxLength={30} />
                  <View style={{ flexDirection: 'row', gap: space.md }}>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label={pricingType === 'hourly' ? 'Price per hour' : 'Price'}
                        prefix="R"
                        value={t.price}
                        onChangeText={(v) => setTier(t.key, { price: digits(v) })}
                        keyboardType="number-pad"
                        placeholder="0"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Hours"
                        optional={pricingType !== 'hourly'}
                        value={t.hours}
                        onChangeText={(v) => setTier(t.key, { hours: v.replace(/[^\d.]/g, '').slice(0, 5) })}
                        keyboardType="decimal-pad"
                        placeholder={pricingType === 'hourly' ? '1' : '—'}
                      />
                    </View>
                  </View>
                  <TextField label="Includes" optional value={t.description} onChangeText={(v) => setTier(t.key, { description: v })} maxLength={500} placeholder="e.g. 150 L geyser, valves and drip tray" />
                  {total != null && (
                    <Text variant="caption" tone="secondary">
                      Clients book {t.hours} hour{t.hours === '1' ? '' : 's'} for {rand(total)}.
                    </Text>
                  )}
                  {err && (
                    <Text variant="caption" tone="danger">
                      {err}
                    </Text>
                  )}
                </Card>
              </Animated.View>
            );
          })}
          {pricingType === 'fixed' && tiers.length < SERVICE_MAX_TIERS && (
            <AddTile
              label="Add a package"
              onPress={() => setTiers((all) => [...all, { key: newKey(), name: DEFAULT_NAMES[all.length] ?? `Package ${all.length + 1}`, price: '', hours: '', description: '' }])}
            />
          )}
        </Animated.View>
      )}

      {id && <SwitchRow label="Show in search" hint="Pause it when you're fully booked" value={active} onChange={setActive} />}
      {id && existing?.active && (
        <Button title="View as a client" icon="eye-outline" variant="outline" onPress={() => router.push({ pathname: '/service/[id]', params: { id } })} />
      )}
    </EditorShell>
  );
}

/** Waits for the handyman's services and profile so the form starts with the saved values. */
export default function ServiceEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const services = useMyServices();
  const profile = useMyProfile();
  if (!profile.data || (id && !services.data)) {
    return (
      <View style={{ flex: 1, padding: space.screen, gap: space.lg, backgroundColor: colors.bg, paddingTop: space.huge * 2 }}>
        <Skeleton height={100} />
        <Skeleton height={52} />
        <Skeleton height={120} />
      </View>
    );
  }
  return <ServiceEditor />;
}
