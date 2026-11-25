import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useHandymanReviews, usePublicHandyman } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { ProfileView } from '@/features/handyman/ProfileView';
import { Banner, Button, Screen, ScreenHeader, Skeleton, space } from '@/ui';

/** What clients see: the handyman's public profile (also used by handymen to preview their own). */
export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = usePublicHandyman(id);
  const reviews = useHandymanReviews(id);
  const isMe = user?.id === id;

  return (
    <Screen header={<ScreenHeader title={isMe ? 'Client preview' : data ? `${data.firstName}'s profile` : ''} />} edges={['top', 'bottom']}>
      {isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={280} />
          <Skeleton height={80} />
          <Skeleton height={160} />
        </View>
      ) : error || !data ? (
        <View style={{ gap: space.md }}>
          <Banner tone="danger" title="Couldn't load this profile" message={error ? errorMessage(error) : undefined} />
          <Button title="Try again" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <>
          {isMe && <Banner tone="info" message="This is exactly what clients see when you quote on their jobs." icon="eye-outline" />}
          <ProfileView h={data} reviews={reviews.data} onProjectPress={(projectId) => router.push({ pathname: '/handyman/[id]/project/[projectId]', params: { id, projectId } })} />
        </>
      )}
    </Screen>
  );
}
