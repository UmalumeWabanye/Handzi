import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { budgetLabel, placeLabel, plural, timeAgo } from '@/lib/format';
import { JOB_STATUS_META, QUOTE_STATUS_META, URGENCY } from '@/lib/jobMeta';
import { Badge, Card, Text, colors, enter, radius, space, useAccent } from '@/ui';

type Props = { job: Job; onPress: () => void; index?: number; perspective: 'client' | 'handyman' };

/** Job summary card. Clients see status + quote count; handymen see distance, budget and their quote state. */
export function JobCard({ job, onPress, index = 0, perspective }: Props) {
  const accent = useAccent();
  const urgency = URGENCY[job.urgency];
  const status = JOB_STATUS_META[job.status];
  const cover = job.photos[0];
  const where = perspective === 'handyman' ? [placeLabel(job.place), job.distanceKm != null && `${job.distanceKm} km away`].filter(Boolean).join(' · ') : null;

  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card onPress={onPress} accessibilityLabel={`${job.title}. ${status.label}`} style={styles.card}>
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: accent.softer }]}>
            <Ionicons name={job.category.icon as keyof typeof Ionicons.glyphMap} size={20} color={accent.main} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" tone="tertiary">
              {job.category.name}
              {job.subcategory ? ` · ${job.subcategory}` : ''} · {timeAgo(job.createdAt)}
            </Text>
            <Text variant="subheading" numberOfLines={2}>
              {job.title}
            </Text>
          </View>
          {cover && <Image source={assetSource(cover)} style={styles.thumb} contentFit="cover" transition={200} />}
        </View>

        {perspective === 'handyman' && (
          <Text variant="body" tone="secondary" numberOfLines={2}>
            {job.description}
          </Text>
        )}

        <View style={styles.meta}>
          {perspective === 'client' ? (
            <>
              <Badge label={status.label} tone={status.tone} />
              {job.status === 'open' && (
                <Badge label={job.quoteCount ? plural(job.quoteCount, 'quote') : 'No quotes yet'} tone={job.quoteCount ? 'success' : 'neutral'} icon="pricetags-outline" />
              )}
            </>
          ) : (
            <>
              {job.myQuote && job.myQuote.status !== 'withdrawn' ? (
                <Badge label={job.myQuote.status === 'pending' ? 'Quoted' : QUOTE_STATUS_META[job.myQuote.status].label} tone={QUOTE_STATUS_META[job.myQuote.status].tone} icon="checkmark" />
              ) : null}
              {job.urgency !== 'flexible' && <Badge label={urgency.label} tone={urgency.tone} icon={urgency.icon} />}
              <Text variant="label">{budgetLabel(job.budget)}</Text>
            </>
          )}
        </View>

        {where ? (
          <View style={styles.inline}>
            <Ionicons name="location-outline" size={14} color={colors.inkTertiary} />
            <Text variant="caption" tone="tertiary" style={{ flex: 1 }} numberOfLines={1}>
              {where}
            </Text>
            <Text variant="caption" tone="tertiary">
              {job.quoteCount ? plural(job.quoteCount, 'quote') : 'Be the first to quote'}
            </Text>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  top: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
