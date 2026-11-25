import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Job } from '@/api/types';
import { budgetLabel, dayLabel, monthYear, placeLabel, timeAgo } from '@/lib/format';
import { URGENCY } from '@/lib/jobMeta';
import { Avatar, Badge, Card, DetailRow, PhotoCarousel, Text, enter, space } from '@/ui';

/** The shared top half of a job detail page (photos, title, key facts, description). */
export function JobBody({ job, children }: { job: Job; children?: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const urgency = URGENCY[job.urgency];
  const where = job.isOwner
    ? job.location?.address || placeLabel(job.location) || 'Your home'
    : [job.address || placeLabel(job.place), job.distanceKm != null && `${job.distanceKm} km from you`].filter(Boolean).join(' · ');

  return (
    <View style={{ gap: space.xl }}>
      {job.photos.length > 0 && (
        <View style={{ marginHorizontal: -space.screen, marginTop: -space.screen }}>
          <PhotoCarousel photos={job.photos} width={width} height={width * 0.68} />
        </View>
      )}
      <Animated.View entering={enter.up(40)} style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Badge label={job.subcategory ? `${job.category.name} · ${job.subcategory}` : job.category.name} tone="accent" />
          {job.urgency !== 'flexible' && <Badge label={urgency.label} tone={urgency.tone} icon={urgency.icon} />}
        </View>
        <Text variant="title">{job.title}</Text>
        <Text variant="caption" tone="tertiary">
          Posted {timeAgo(job.createdAt)}
        </Text>
      </Animated.View>

      <Animated.View entering={enter.up(90)}>
        <Card style={{ gap: space.xs }}>
          <DetailRow icon="location-outline" label="Where" value={where || '—'} />
          <DetailRow icon="calendar-outline" label="When" value={job.preferredDate ? `${dayLabel(job.preferredDate)} preferred` : urgency.hint} />
          <DetailRow icon="cash-outline" label="Budget" value={budgetLabel(job.budget)} emphasis />
        </Card>
      </Animated.View>

      <Animated.View entering={enter.up(140)} style={{ gap: space.sm }}>
        <Text variant="heading">Job details</Text>
        <Text variant="body" tone="secondary">
          {job.description}
        </Text>
      </Animated.View>

      {!job.isOwner && job.client && (
        <Animated.View entering={enter.up(180)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar uri={job.client.avatar} name={job.client.firstName} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Posted by {job.client.firstName}</Text>
              <Text variant="caption" tone="tertiary">
                On Handzi since {monthYear(job.client.memberSince)}
              </Text>
            </View>
          </Card>
        </Animated.View>
      )}
      {children}
    </View>
  );
}
