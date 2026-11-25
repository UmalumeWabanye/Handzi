import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMyProfile } from '@/api/hooks';
import { Banner, Button, Card, EmptyState, FormBody, Skeleton, space } from '@/ui';
import { SectionProps } from '../shared/types';
import { AddTile, CertificationRow, ProjectTile, WorkTimelineItem } from './ProfileBlocks';

function footer(mode: SectionProps['mode'], count: number, onDone: () => void, onSkip?: () => void, required = true) {
  if (mode === 'edit') return <Button title="Done" onPress={onDone} />;
  return (
    <>
      <Button title="Continue" onPress={onDone} disabled={required && count === 0} />
      {onSkip && count === 0 && <Button title="Skip for now" variant="ghost" onPress={onSkip} />}
    </>
  );
}

const Loading = () => (
  <View style={{ gap: space.md }}>
    <Skeleton height={90} />
    <Skeleton height={90} />
  </View>
);

export function ExperienceSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { data, isLoading } = useMyProfile();
  const items = [...(data?.profile.workHistory ?? [])].sort(
    (a, b) => Number(b.current) - Number(a.current) || +new Date(b.startDate) - +new Date(a.startDate)
  );
  return (
    <FormBody bottomInset={bottomInset} footer={footer(mode, items.length, onDone)}>
      {intro}
      {isLoading ? (
        <Loading />
      ) : items.length ? (
        <Card>
          {items.map((w, i) => (
            <WorkTimelineItem key={w._id} item={w} index={i} last={i === items.length - 1} onPress={() => router.push({ pathname: '/editor/work', params: { id: w._id } })} />
          ))}
        </Card>
      ) : (
        <EmptyState compact icon="briefcase-outline" title="Add your first role" text="Self-employed counts. Include apprenticeships and jobs at other companies too." />
      )}
      <AddTile label={items.length ? 'Add another role' : 'Add experience'} onPress={() => router.push('/editor/work')} />
    </FormBody>
  );
}

export function PortfolioSection({ mode, onDone, intro, bottomInset }: SectionProps) {
  const { data, isLoading } = useMyProfile();
  const items = data?.profile.portfolio ?? [];
  return (
    <FormBody bottomInset={bottomInset} footer={footer(mode, items.length, onDone)}>
      {intro}
      {mode === 'onboarding' && (
        <Banner tone="info" title="Photos win jobs" message="Before-and-after shots and close-ups of finished work build the most trust." icon="bulb-outline" />
      )}
      {isLoading ? (
        <Loading />
      ) : items.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.lg }}>
          {items.map((p, i) => (
            <ProjectTile key={p._id} project={p} index={i} onPress={() => router.push({ pathname: '/editor/project', params: { id: p._id } })} />
          ))}
        </View>
      ) : (
        <EmptyState compact icon="images-outline" title="Show your best work" text="Add a project with photos of a job you've completed." />
      )}
      <AddTile label={items.length ? 'Add another project' : 'Add a project'} icon="camera-outline" onPress={() => router.push('/editor/project')} />
    </FormBody>
  );
}

export function CertificationsSection({ mode, onDone, onSkip, intro, bottomInset }: SectionProps) {
  const { data, isLoading } = useMyProfile();
  const items = data?.profile.certifications ?? [];
  return (
    <FormBody bottomInset={bottomInset} footer={footer(mode, items.length, onDone, onSkip, false)}>
      {intro}
      {isLoading ? (
        <Loading />
      ) : items.length ? (
        <Card style={{ gap: space.xs }}>
          {items.map((c) => (
            <CertificationRow key={c._id} cert={c} onPress={() => router.push({ pathname: '/editor/certification', params: { id: c._id } })} />
          ))}
        </Card>
      ) : (
        <EmptyState
          compact
          icon="ribbon-outline"
          title="Licences & qualifications"
          text="e.g. PIRB registration, wireman's licence, trade test, NHBRC. Verified certificates get a badge on your profile."
        />
      )}
      <AddTile label={items.length ? 'Add another' : 'Add a certification'} onPress={() => router.push('/editor/certification')} />
    </FormBody>
  );
}
