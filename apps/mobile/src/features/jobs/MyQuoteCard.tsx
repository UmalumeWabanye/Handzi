import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { MyQuote } from '@/api/types';
import { placeLabel, rand, timeAgo } from '@/lib/format';
import { QUOTE_STATUS_META } from '@/lib/jobMeta';
import { Badge, Card, Text, enter, radius, space, useAccent } from '@/ui';

/** A quote the handyman sent, in their "My quotes" list. */
export function MyQuoteCard({ quote, index, onPress }: { quote: MyQuote; index: number; onPress: () => void }) {
  const accent = useAccent();
  const status = QUOTE_STATUS_META[quote.status];
  const jobClosed = quote.status === 'pending' && quote.job.status !== 'open';
  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card onPress={onPress} style={styles.card} accessibilityLabel={`${quote.job.title}, ${rand(quote.amount)}, ${status.label}`}>
        <View style={[styles.icon, { backgroundColor: accent.softer }]}>
          <Ionicons name={(quote.job.category?.icon ?? 'construct-outline') as keyof typeof Ionicons.glyphMap} size={20} color={accent.main} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {quote.job.title}
          </Text>
          <Text variant="caption" tone="tertiary">
            {[placeLabel(quote.job.location), `sent ${timeAgo(quote.createdAt)}`].filter(Boolean).join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 }}>
            <Badge label={jobClosed ? 'Job closed' : status.label} tone={jobClosed ? 'neutral' : status.tone} icon={status.icon} />
          </View>
        </View>
        <Text variant="subheading" color={accent.dark}>
          {rand(quote.amount)}
        </Text>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
