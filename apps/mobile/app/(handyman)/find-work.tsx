import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import { errorMessage } from '@/api/client';
import { useJobFeed, useMyProfile, useMyQuotes } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { JobCard } from '@/features/jobs/JobCard';
import { MyQuoteCard } from '@/features/jobs/MyQuoteCard';
import { ProfileStrength } from '@/features/handyman/ProfileStrength';
import { NotificationBell } from '@/features/shared/NotificationBell';
import { TabPage } from '@/features/shared/TabPage';
import { Avatar, Banner, Button, CardSkeleton, Chip, ChipRow, EmptyState, ScalePressable, Segmented, space } from '@/ui';

type Tab = 'jobs' | 'quotes';

export default function FindWork() {
  const { user } = useAuth();
  const profile = useMyProfile();
  const [tab, setTab] = useState<Tab>('jobs');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const feed = useJobFeed(scope);
  const quotes = useMyQuotes();

  const status = profile.data?.profile.verification.status;
  const incomplete = profile.data?.checklist.some((i) => i.required && !i.done);
  const noArea = axios.isAxiosError(feed.error) && feed.error.response?.status === 400;
  const activeQuotes = (quotes.data ?? []).filter((q) => q.status === 'pending').length;

  const refresh = () => {
    profile.refetch();
    feed.refetch();
    quotes.refetch();
  };

  return (
    <TabPage
      subtitle={`Hi ${user?.firstName}`}
      title="Find work"
      refreshing={feed.isRefetching || quotes.isRefetching}
      onRefresh={refresh}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <NotificationBell />
          <ScalePressable onPress={() => router.push('/me')} accessibilityRole="button" accessibilityLabel="Your profile">
            <Avatar uri={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size={48} verified={status === 'verified'} />
          </ScalePressable>
        </View>
      }
    >
      {status === 'pending' && <Banner tone="warning" title="ID verification in progress" message="You can browse jobs now and send quotes once you're verified." />}
      {status === 'rejected' && (
        <Banner tone="danger" title="Verification unsuccessful" message={profile.data?.profile.verification.rejectionReason || 'Please upload your documents again.'}>
          <Button title="Upload again" size="md" variant="outline" onPress={() => router.push('/edit/verification')} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
        </Banner>
      )}
      {profile.data && incomplete && <ProfileStrength checklist={profile.data.checklist} showDone={false} onOpen={(k) => router.push(`/edit/${k}`)} />}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'jobs', label: 'Jobs near you', count: feed.data?.jobs.length },
          { value: 'quotes', label: 'My quotes', count: activeQuotes },
        ]}
      />

      {tab === 'jobs' ? (
        <View key="jobs" style={{ gap: space.md }}>
          <ChipRow>
            <Chip label="My trades" selected={scope === 'mine'} onPress={() => setScope('mine')} />
            <Chip label="All trades" selected={scope === 'all'} onPress={() => setScope('all')} />
          </ChipRow>
          {feed.isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : noArea ? (
            <Banner tone="warning" title="Set your service area" message="We use it to show you jobs nearby.">
              <Button title="Set service area" size="md" variant="outline" onPress={() => router.push('/edit/area')} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
            </Banner>
          ) : feed.error ? (
            <Banner tone="danger" message={errorMessage(feed.error)} />
          ) : feed.data?.jobs.length ? (
            feed.data.jobs.map((j, i) => (
              <JobCard key={j._id} job={j} index={i} perspective="handyman" onPress={() => router.push({ pathname: '/work/[id]', params: { id: j._id } })} />
            ))
          ) : (
            <EmptyState
              compact
              icon="search-outline"
              title="No open jobs right now"
              text={`Nothing within ${feed.data?.radiusKm ?? profile.data?.profile.serviceRadiusKm ?? 25} km${scope === 'mine' ? ' in your trades' : ''}. Pull down to refresh, or widen your travel distance.`}
              action={<Button title="Change service area" variant="outline" size="md" onPress={() => router.push('/edit/area')} />}
            />
          )}
        </View>
      ) : (
        <View key="quotes" style={{ gap: space.md }}>
          {quotes.isLoading ? (
            <CardSkeleton />
          ) : quotes.data?.length ? (
            quotes.data.map((q, i) => <MyQuoteCard key={q._id} quote={q} index={i} onPress={() => router.push({ pathname: '/work/[id]', params: { id: q.job._id } })} />)
          ) : (
            <EmptyState compact icon="pricetags-outline" title="No quotes yet" text="Quotes you send on jobs will appear here so you can track them." />
          )}
        </View>
      )}
    </TabPage>
  );
}
