import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { useBookService, useService } from '@/api/hooks';
import type { ServiceDetail, ServiceTier } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { haptic } from '@/lib/haptics';
import { placeLabel, rand } from '@/lib/format';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  DayPicker,
  OptionCard,
  PhotoCarousel,
  Screen,
  ScreenHeader,
  Section,
  Sheet,
  Skeleton,
  Text,
  TextField,
  colors,
  enter,
  fonts,
  space,
  useToast,
} from '@/ui';

const tierTotal = (s: ServiceDetail, t: ServiceTier) => (s.pricingType === 'hourly' ? t.price * (t.estimatedHours || 1) : t.price);
const tierSubtitle = (s: ServiceDetail, t: ServiceTier) =>
  [s.pricingType === 'hourly' ? `${rand(t.price)}/hr × ${t.estimatedHours ?? 1} hr` : t.estimatedHours ? `About ${t.estimatedHours} hr` : null, t.description]
    .filter(Boolean)
    .join(' · ');

/** A service package: photos, who offers it, the packages, and booking. */
export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const q = useService(id);
  const book = useBookService();
  const toast = useToast();
  const [tierId, setTierId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const s = q.data;
  const tier = s?.tiers.find((t) => t._id === (tierId ?? s.tiers[0]?._id));
  const h = s?.handyman;
  const asClient = user?.activeMode === 'client';

  const confirm = async () => {
    if (!s || !tier) return;
    try {
      const b = await book.mutateAsync({ id: s._id, tierId: tier._id, scheduledFor: day, note: note.trim() || undefined });
      haptic.success();
      setConfirming(false);
      toast(`Booked with ${s.handyman.firstName}. Pay to confirm it.`);
      router.replace({ pathname: '/booking/[id]', params: { id: b._id } });
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const footer = !s ? null : s.isOwner ? (
    <Button title="Edit service" icon="create-outline" variant="outline" onPress={() => router.push({ pathname: '/service-editor', params: { id: s._id } })} />
  ) : !asClient ? null : s.pricingType === 'quote' ? (
    <Button title="Request a quote" icon="chatbubble-ellipses-outline" onPress={() => router.push({ pathname: '/post-job', params: { category: s.category._id } })} />
  ) : s.bookable && tier ? (
    <Button title={`Book ${tier.name} · ${rand(tierTotal(s, tier))}`} icon="calendar-outline" onPress={() => setConfirming(true)} />
  ) : null;

  return (
    <Screen edges={['top', 'bottom']} header={<ScreenHeader title="Service" />} footer={footer} refreshing={q.isRefetching} onRefresh={q.refetch}>
      {q.isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={200} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={120} />
        </View>
      ) : q.error || !s || !h ? (
        <Banner tone="danger" title="This service isn't available" message={q.error ? errorMessage(q.error) : undefined} />
      ) : (
        <>
          {s.photos.length > 0 && (
            <View style={{ marginHorizontal: -space.screen, marginTop: -space.screen }}>
              <PhotoCarousel photos={s.photos} width={width} height={width * 0.62} />
            </View>
          )}
          <Animated.View entering={enter.up(40)} style={{ gap: space.sm }}>
            <Badge label={s.subcategory ? `${s.category.name} · ${s.subcategory}` : s.category.name} tone="accent" />
            <Text variant="title">{s.title}</Text>
            {!s.active && <Badge label="Paused: not visible to clients" tone="neutral" />}
          </Animated.View>

          <Animated.View entering={enter.up(80)}>
            <Card
              onPress={() => router.push({ pathname: '/handyman/[id]', params: { id: h.userId } })}
              style={styles.who}
              accessibilityLabel={`${h.firstName} ${h.lastName}. View profile`}
            >
              <Avatar uri={h.avatar} name={`${h.firstName} ${h.lastName}`} size={52} verified={h.verified} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">
                  {h.firstName} {h.lastName}
                </Text>
                <View style={styles.inline}>
                  <Ionicons name="star" size={14} color={colors.star} />
                  <Text variant="caption" tone="secondary">
                    {h.stats?.reviewCount ? `${h.stats.averageRating.toFixed(1)} · ${h.stats.jobsCompleted} jobs` : 'New on Handzi'}
                  </Text>
                </View>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {[placeLabel(h.place), s.distanceKm != null && `${s.distanceKm} km from you`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkDisabled} />
            </Card>
          </Animated.View>

          <Animated.View entering={enter.up(120)} style={{ gap: space.sm }}>
            <Text variant="heading">What's included</Text>
            <Text variant="body" tone="secondary">
              {s.description}
            </Text>
          </Animated.View>

          {s.pricingType === 'quote' ? (
            <Banner tone="info" title="Priced by quote" message={`${h.firstName} quotes after seeing the job. Post your job and they'll be notified.`} />
          ) : (
            <Section title={s.pricingType === 'hourly' ? 'Rate' : 'Choose a package'}>
              <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
                {s.tiers.map((t) => (
                  <View key={t._id}>
                    <OptionCard title={`${t.name} · ${rand(tierTotal(s, t))}`} subtitle={tierSubtitle(s, t) || undefined} selected={tier?._id === t._id} onPress={() => setTierId(t._id)} />
                  </View>
                ))}
              </View>
            </Section>
          )}

          {!s.isOwner && asClient && !s.bookable && s.pricingType !== 'quote' && (
            <Banner tone="warning" message={`${h.firstName} isn't taking bookings right now.`} />
          )}
          {!s.isOwner && !asClient && <Banner tone="info" message="Switch to hiring from your profile to book services." />}

          <Sheet visible={confirming} onClose={() => setConfirming(false)} title={tier ? `Book ${tier.name}` : 'Book'}>
            {tier && (
              <View style={{ gap: space.md }}>
                <Card style={styles.total}>
                  <Text variant="body" tone="secondary" style={{ flex: 1 }}>
                    {s.title}
                  </Text>
                  <Text variant="heading" style={{ fontFamily: fonts.display }}>
                    {rand(tierTotal(s, tier))}
                  </Text>
                </Card>
                <DayPicker label="Preferred day" optional value={day} onChange={setDay} days={14} />
                <TextField label="Anything to add?" optional value={note} onChangeText={setNote} maxLength={1000} placeholder="Access, parking, gate code…" />
                <Text variant="caption" tone="secondary">
                  At {placeLabel(user?.location) || 'your home address'}. You'll pay on the next screen; the money is held until you confirm the job is done.
                </Text>
                <Button title="Confirm booking" onPress={confirm} loading={book.isPending} />
              </View>
            )}
          </Sheet>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  total: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
