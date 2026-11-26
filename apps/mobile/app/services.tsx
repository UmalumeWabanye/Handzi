import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SERVICE_SEARCH_RADII } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useCategories, useServiceSearch } from '@/api/hooks';
import type { GeoPoint } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { ServiceCard } from '@/features/services/ServiceCard';
import { LocationPicker } from '@/features/shared/LocationPicker';
import { placeLabel } from '@/lib/format';
import { Banner, Button, CardSkeleton, Chip, EmptyState, ScalePressable, Screen, ScreenHeader, Sheet, Text, TextField, colors, space, useAccent } from '@/ui';

const DEFAULT_RADIUS = 25;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Client: find service packages by type, trade, location and distance. */
export default function FindServices() {
  const { user } = useAuth();
  const accent = useAccent();
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const categories = useCategories();
  const [text, setText] = useState(params.q ?? '');
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [place, setPlace] = useState<GeoPoint | undefined>(user?.location);
  const [picking, setPicking] = useState(false);
  const q = useDebounced(text.trim());

  const coords = place?.coordinates;
  const search = useServiceSearch({ q: q || undefined, category, radiusKm, lat: coords?.[1], lng: coords?.[0] }, !!coords);
  const results = search.data?.services ?? [];
  const nextRadius = SERVICE_SEARCH_RADII.find((r) => r > radiusKm);
  const where = placeLabel(place) || place?.address || 'your location';

  return (
    <Screen edges={['top', 'bottom']} header={<ScreenHeader title="Find a service" />} refreshing={search.isRefetching && !search.isPlaceholderData} onRefresh={() => search.refetch()}>
      <TextField
        label="What do you need?"
        icon="search"
        value={text}
        onChangeText={setText}
        placeholder="e.g. geyser, paving, COC, painting"
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={!params.category && !params.q}
        clearButtonMode="while-editing"
      />

      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Near
        </Text>
        <ScalePressable onPress={() => setPicking(true)} style={styles.place} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`Searching near ${where}. Change location`}>
          <Ionicons name="location" size={20} color={accent.graphic} />
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {coords ? where : 'Choose a location'}
          </Text>
          <Text variant="label" color={accent.main}>
            Change
          </Text>
        </ScalePressable>
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="label" tone="secondary">
          Within
        </Text>
        <View style={styles.row}>
          {SERVICE_SEARCH_RADII.map((r) => (
            <Chip key={r} label={`${r} km`} selected={radiusKm === r} onPress={() => setRadiusKm(r)} />
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.screen }} style={{ marginHorizontal: -space.screen }}>
        <Chip label="All trades" selected={!category} onPress={() => setCategory(undefined)} />
        {categories.data?.map((c) => (
          <Chip
            key={c._id}
            label={c.name}
            icon={c.icon as keyof typeof Ionicons.glyphMap}
            selected={category === c._id}
            onPress={() => setCategory(category === c._id ? undefined : c._id)}
          />
        ))}
      </ScrollView>

      {!coords ? (
        <EmptyState compact title="Where should we look?" text="Choose a location to see services near you." action={<Button title="Choose location" onPress={() => setPicking(true)} />} />
      ) : search.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : search.error ? (
        <Banner tone="danger" message={errorMessage(search.error)} />
      ) : (
        // Previous results stay on screen (dimmed) while a new filter loads.
        <View style={{ gap: space.md, opacity: search.isPlaceholderData ? 0.5 : 1 }}>
          <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
            {results.length ? `${results.length} service${results.length === 1 ? '' : 's'} within ${radiusKm} km` : ' '}
          </Text>
          {results.length ? (
            results.map((s, i) => <ServiceCard key={s._id} s={s} index={i} onPress={() => router.push({ pathname: '/service/[id]', params: { id: s._id } })} />)
          ) : (
            <EmptyState
              compact
              title={q ? `No "${q}" services within ${radiusKm} km` : `No services within ${radiusKm} km`}
              text={nextRadius ? 'Try a wider range, or post a job and let handymen quote.' : 'Post a job and let handymen near you quote.'}
              action={
                <View style={{ gap: space.sm }}>
                  {nextRadius && <Button title={`Search within ${nextRadius} km`} variant="secondary" onPress={() => setRadiusKm(nextRadius)} />}
                  <Button title="Post a job instead" variant="outline" onPress={() => router.push({ pathname: '/post-job', params: category ? { category } : {} })} />
                </View>
              }
            />
          )}
        </View>
      )}

      <Sheet visible={picking} onClose={() => setPicking(false)} title="Search near">
        <LocationPicker
          label="Location"
          value={place}
          onChange={(p) => {
            setPlace(p);
            setPicking(false);
          }}
        />
        {user?.location && (
          <Button
            title="Use my home"
            variant="ghost"
            icon="home-outline"
            onPress={() => {
              setPlace(user.location);
              setPicking(false);
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
