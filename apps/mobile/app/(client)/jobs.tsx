import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useMyJobs } from '@/api/hooks';
import { JobCard } from '@/features/jobs/JobCard';
import { TabPage } from '@/features/shared/TabPage';
import { ACTIVE_JOB_STATUSES } from '@/lib/jobMeta';
import { Banner, Button, CardSkeleton, EmptyState, IconButton, Segmented, space, useAccent } from '@/ui';

export default function ClientJobs() {
  const accent = useAccent();
  const jobs = useMyJobs();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const active = (jobs.data ?? []).filter((j) => ACTIVE_JOB_STATUSES.includes(j.status));
  const past = (jobs.data ?? []).filter((j) => !ACTIVE_JOB_STATUSES.includes(j.status));
  const list = tab === 'active' ? active : past;

  return (
    <TabPage
      title="My jobs"
      refreshing={jobs.isRefetching}
      onRefresh={jobs.refetch}
      right={<IconButton icon="add" label="Post a job" color="#fff" background={accent.main} size={44} onPress={() => router.push('/post-job')} />}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'Active', count: active.length },
          { value: 'past', label: 'Past', count: past.length },
        ]}
      />
      {jobs.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : jobs.error ? (
        <Banner tone="danger" message={errorMessage(jobs.error)} />
      ) : list.length ? (
        <View key={tab} style={{ gap: space.md }}>
          {list.map((j, i) => (
            <JobCard key={j._id} job={j} index={i} perspective="client" onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: j._id } })} />
          ))}
        </View>
      ) : tab === 'active' ? (
        <EmptyState
          icon="clipboard-outline"
          title="No jobs yet"
          text="Your next one is just a tap away. Post a job and verified handymen near you will quote."
          action={<Button title="Post a job" icon="add" onPress={() => router.push('/post-job')} />}
        />
      ) : (
        <EmptyState icon="archive-outline" title="Nothing here yet" text="Completed and cancelled jobs will show up here." />
      )}
    </TabPage>
  );
}
