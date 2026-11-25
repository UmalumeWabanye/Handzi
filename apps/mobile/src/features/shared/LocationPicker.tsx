import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { GeoPoint } from '@/api/types';
import { currentPlace, searchPlace } from '@/lib/location';
import { Banner, Button, Card, Text, TextField, colors, enter, radius, space, useAccent } from '@/ui';

type Props = { value?: GeoPoint | null; onChange: (p: GeoPoint) => void; error?: string | null; label?: string };

export function LocationPicker({ value, onChange, error, label = 'Your area' }: Props) {
  const accent = useAccent();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<'gps' | 'search' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const useGps = async () => {
    setProblem(null);
    setBusy('gps');
    try {
      const res = await currentPlace();
      if (res === 'denied') setProblem('Location permission was declined. Search for your suburb instead.');
      else onChange(res);
    } catch {
      setProblem("We couldn't get your location. Search for your suburb instead.");
    } finally {
      setBusy(null);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setProblem(null);
    setBusy('search');
    try {
      const res = await searchPlace(query.trim());
      if (res) onChange(res);
      else setProblem(`We couldn't find "${query}". Try a suburb and city, e.g. "Sandton, Johannesburg".`);
    } catch {
      setProblem('Search failed. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const title = value ? value.suburb || value.address || value.city || 'Pinned location' : null;
  const subtitle = value ? [value.city, value.province].filter(Boolean).join(', ') : null;

  return (
    <View style={{ gap: space.md }}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>
      {value ? (
        <Animated.View key={`${value.coordinates[0]},${value.coordinates[1]}`} entering={enter.pop()}>
          <Card style={styles.selected}>
            <View style={[styles.pin, { backgroundColor: accent.softer }]}>
              <Ionicons name="location" size={22} color={accent.main} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{title}</Text>
              {!!subtitle && (
                <Text variant="caption" tone="tertiary">
                  {subtitle}
                </Text>
              )}
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </Card>
        </Animated.View>
      ) : (
        error && <Banner tone="danger" message={error} />
      )}
      <Button
        title={value ? 'Update to my current location' : 'Use my current location'}
        icon="navigate-outline"
        variant="secondary"
        onPress={useGps}
        loading={busy === 'gps'}
      />
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Or search"
            icon="search"
            value={query}
            onChangeText={setQuery}
            placeholder="Suburb or address"
            returnKeyType="search"
            onSubmitEditing={search}
            autoCorrect={false}
          />
        </View>
        <Button title="Find" size="md" variant="outline" onPress={search} loading={busy === 'search'} style={styles.find} />
      </View>
      {problem && <Banner tone="warning" message={problem} />}
    </View>
  );
}

const styles = StyleSheet.create({
  selected: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pin: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  find: { minHeight: 52 },
});
