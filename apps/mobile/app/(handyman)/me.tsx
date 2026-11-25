import React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useHandymanReviews, useMyProfile } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { ProfileStrength } from '@/features/handyman/ProfileStrength';
import { ProfileView, toPublicShape } from '@/features/handyman/ProfileView';
import { ModeSwitchCard } from '@/features/shared/ModeSwitchCard';
import { TabPage } from '@/features/shared/TabPage';
import { Button, ListGroup, ListRow, Section, Skeleton, space } from '@/ui';

export default function HandymanMe() {
  const { user, logout } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useMyProfile();
  const reviews = useHandymanReviews(user?.id ?? '');

  return (
    <TabPage title="Your profile" refreshing={isRefetching} onRefresh={refetch}>
      {isLoading || !data || !user ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={260} />
          <Skeleton height={120} />
        </View>
      ) : (
        <>
          <Button
            title="Preview as a client"
            icon="eye-outline"
            variant="secondary"
            onPress={() => router.push({ pathname: '/handyman/[id]', params: { id: user.id } })}
          />
          {data.checklist.some((i) => !i.done) && <ProfileStrength checklist={data.checklist} onOpen={(k) => router.push(`/edit/${k}`)} showDone={false} />}
          <ProfileView
            h={toPublicShape(data.profile, user)}
            reviews={reviews.data}
            pendingVerification={data.profile.verification.status === 'pending'}
            onEdit={(k) => router.push(`/edit/${k}`)}
            onProjectPress={(id) => router.push({ pathname: '/editor/project', params: { id } })}
          />
          <Section title="Settings">
            <ListGroup>
              <ListRow
                icon="shield-checkmark-outline"
                title="ID verification"
                subtitle={{ none: 'Not submitted', pending: 'Under review', verified: 'Verified', rejected: 'Action needed' }[data.profile.verification.status]}
                onPress={() => router.push('/edit/verification')}
              />
              <ListRow icon="location-outline" title="Service area, rates & availability" onPress={() => router.push('/edit/area')} />
            </ListGroup>
          </Section>
          <ModeSwitchCard />
          <ListGroup>
            <ListRow
              icon="log-out-outline"
              title="Log out"
              tone="danger"
              onPress={() => Alert.alert('Log out?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])}
            />
          </ListGroup>
        </>
      )}
    </TabPage>
  );
}
