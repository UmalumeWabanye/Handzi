import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useMyServices } from '@/api/hooks';
import type { Service, ServiceCard as Card_ } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { ServiceCard } from '@/features/services/ServiceCard';
import { TabPage } from '@/features/shared/TabPage';
import { Banner, Button, CardSkeleton, EmptyState, IconButton, Text, colors, palette, space } from '@/ui';

const toCard = (s: Service, handyman: Card_['handyman']): Card_ => ({
  _id: s._id,
  title: s.title,
  category: s.category,
  subcategory: s.subcategory,
  photo: s.photos[0],
  pricingType: s.pricingType,
  fromPrice: s.pricingType === 'quote' || !s.tiers.length ? null : Math.min(...s.tiers.map((t) => t.price)),
  tierCount: s.tiers.length,
  active: s.active,
  handyman,
});

/** Handyman: the service packages clients can find in search and book directly. */
export default function MyServices() {
  const { user } = useAuth();
  const q = useMyServices();
  const add = () => router.push('/service-editor');
  const me = { userId: user?.id ?? '', firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', avatar: user?.avatar, verified: !!q.data?.visible, place: null };
  const list = q.data?.services ?? [];

  return (
    <TabPage
      title="My services"
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
      right={list.length > 0 ? <IconButton icon="add" label="Add a service" color={colors.onAccent} background={palette.brick} size={44} onPress={add} /> : undefined}
    >
      <Text variant="body" tone="secondary">
        Packages with a set price that clients can book straight away, like a geyser replacement or unblocking a drain.
      </Text>
      {q.data && !q.data.visible && (
        <Banner tone="warning" title="Not in search yet" message="Clients will find your services once your profile is published and your ID is verified." />
      )}
      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : q.error ? (
        <Banner tone="danger" message={errorMessage(q.error)} />
      ) : list.length ? (
        <>
          <Button title="Add a service" icon="add" onPress={add} />
          <View style={{ gap: space.md }}>
            {list.map((s, i) => (
              <ServiceCard key={s._id} s={toCard(s, me)} index={i} showHandyman={false} showStatus onPress={() => router.push({ pathname: '/service-editor', params: { id: s._id } })} />
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          title="No services yet"
          text="Add your first service so clients nearby can book you without waiting for quotes."
          action={<Button title="Add a service" icon="add" onPress={add} />}
        />
      )}
    </TabPage>
  );
}
