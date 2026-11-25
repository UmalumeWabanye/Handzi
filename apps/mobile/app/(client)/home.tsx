import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useCategories, useHandymen } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { HandymanCard } from '@/features/handyman/HandymanCard';
import { NotificationBell } from '@/features/shared/NotificationBell';
import { Avatar, Banner, Button, CardSkeleton, Chip, EmptyState, Screen, Section, Text, enter, radius, space, useAccent, ScalePressable } from '@/ui';

export default function ClientHome() {
  const { user } = useAuth();
  const accent = useAccent();
  const categories = useCategories();
  const [category, setCategory] = useState<string | undefined>();
  const coords = user?.location?.coordinates;
  const handymen = useHandymen({ category, lat: coords?.[1], lng: coords?.[0] });

  // Put the user's interests first.
  const ordered = [...(categories.data ?? [])].sort(
    (a, b) => Number(user?.interests?.includes(b._id)) - Number(user?.interests?.includes(a._id))
  );
  const area = user?.location?.suburb || user?.location?.city;

  return (
    <Screen refreshing={handymen.isRefetching} onRefresh={() => handymen.refetch()}>
      <Animated.View entering={enter.up(0, 6)} style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body" tone="secondary">
            Hi {user?.firstName}
          </Text>
          <Text variant="title">What needs fixing?</Text>
          {area && (
            <ScalePressable onPress={() => router.push('/edit/location')} style={styles.place} accessibilityRole="button" accessibilityLabel={`Location: ${area}. Change`}>
              <Ionicons name="location" size={14} color={accent.main} />
              <Text variant="label" color={accent.dark}>
                {area}
              </Text>
              <Ionicons name="chevron-down" size={14} color={accent.dark} />
            </ScalePressable>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <NotificationBell />
          <ScalePressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Your profile">
            <Avatar uri={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size={48} />
          </ScalePressable>
        </View>
      </Animated.View>

      <Animated.View entering={enter.up(80)}>
        <ScalePressable
          onPress={() => router.push({ pathname: '/post-job', params: category ? { category } : {} })}
          hapticFeedback
          scaleTo={0.98}
          style={[styles.cta, { backgroundColor: accent.main }]}
          accessibilityRole="button"
          accessibilityLabel="Post a job and get quotes"
        >
          <View style={styles.ctaShape} />
          <Text variant="heading" color="#fff">
            Post a job, get quotes
          </Text>
          <Text variant="body" color="rgba(255,255,255,0.9)">
            Describe the problem and verified handymen nearby will send you prices.
          </Text>
          <View style={styles.ctaButton}>
            <Text variant="bodyStrong" color={accent.dark}>
              Post a job
            </Text>
            <Ionicons name="arrow-forward" size={18} color={accent.dark} />
          </View>
        </ScalePressable>
      </Animated.View>

      <Section title="Browse by trade">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.screen }} style={{ marginHorizontal: -space.screen, paddingLeft: space.screen }}>
          <Chip label="All" selected={!category} onPress={() => setCategory(undefined)} />
          {ordered.map((c) => (
            <Chip
              key={c._id}
              label={c.name}
              icon={c.icon as keyof typeof Ionicons.glyphMap}
              selected={category === c._id}
              onPress={() => setCategory(category === c._id ? undefined : c._id)}
            />
          ))}
        </ScrollView>
      </Section>

      <Section title="Handymen near you" subtitle={area ? `Working around ${area}` : undefined}>
        {handymen.isLoading ? (
          <View style={{ gap: space.md }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : handymen.error ? (
          <View style={{ gap: space.md }}>
            <Banner tone="danger" message={errorMessage(handymen.error)} />
            <Button title="Try again" variant="outline" onPress={() => handymen.refetch()} />
          </View>
        ) : handymen.data?.length ? (
          <View style={{ gap: space.lg }}>
            {handymen.data.map((h, i) => (
              <HandymanCard key={h.userId} h={h} index={i} onPress={() => router.push({ pathname: '/handyman/[id]', params: { id: h.userId } })} />
            ))}
          </View>
        ) : (
          <EmptyState compact icon="search-outline" title="No handymen here yet" text={category ? 'Try another trade, or check back soon.' : 'New handymen join every day. Check back soon.'} />
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.xs, alignSelf: 'flex-start' },
  cta: { borderRadius: radius.lg, padding: space.xl, gap: space.sm, overflow: 'hidden' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: radius.pill,
    marginTop: space.xs,
  },
  ctaShape: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -60, top: -80, backgroundColor: 'rgba(255,255,255,0.12)' },
});
