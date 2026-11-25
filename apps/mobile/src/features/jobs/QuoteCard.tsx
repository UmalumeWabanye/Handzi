import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { QuoteWithHandyman } from '@/api/types';
import { dayLabel, rand, timeAgo } from '@/lib/format';
import { QUOTE_STATUS_META } from '@/lib/jobMeta';
import { Avatar, Badge, Button, Card, ScalePressable, Text, colors, enter, layout, space, useAccent } from '@/ui';

type Props = {
  quote: QuoteWithHandyman;
  index: number;
  canDecide: boolean;
  lowest?: boolean;
  onViewProfile: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onMessage: () => void;
};

/** A quote as the client sees it: who, how much, how long, what they said. */
export function QuoteCard({ quote, index, canDecide, lowest, onViewProfile, onAccept, onDecline, onMessage }: Props) {
  const accent = useAccent();
  const [expanded, setExpanded] = useState(false);
  const h = quote.handyman;
  const name = `${h.firstName} ${h.lastName}`;
  const status = QUOTE_STATUS_META[quote.status];
  const dimmed = quote.status === 'rejected';

  return (
    <Animated.View entering={enter.stagger(index)} layout={layout()} style={dimmed && { opacity: 0.6 }}>
      <Card style={[styles.card, quote.status === 'accepted' && { borderColor: colors.success, borderWidth: 1.5 }]}>
        <ScalePressable onPress={onViewProfile} scaleTo={0.98} style={styles.who} accessibilityRole="button" accessibilityLabel={`View ${name}'s profile`}>
          <Avatar uri={h.avatar} name={name} size={48} verified={h.verified} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.inline}>
              {h.stats.reviewCount > 0 ? (
                <>
                  <Ionicons name="star" size={13} color={colors.star} />
                  <Text variant="caption">
                    {h.stats.averageRating.toFixed(1)} ({h.stats.reviewCount})
                  </Text>
                </>
              ) : (
                <Text variant="caption" tone="tertiary">
                  New on Handzi
                </Text>
              )}
              {h.yearsExperience > 0 && (
                <Text variant="caption" tone="tertiary">
                  · {h.yearsExperience} yrs
                </Text>
              )}
              {h.distanceKm != null && (
                <Text variant="caption" tone="tertiary">
                  · {h.distanceKm} km
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkDisabled} />
        </ScalePressable>

        <View style={styles.priceRow}>
          <View style={{ gap: 2 }}>
            <Text variant="caption" tone="tertiary">
              Quote
            </Text>
            <Text variant="title" color={accent.dark}>
              {rand(quote.amount)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {quote.status !== 'pending' ? <Badge label={status.label} tone={status.tone} icon={status.icon} /> : lowest ? <Badge label="Lowest price" tone="success" /> : null}
            <Text variant="caption" tone="tertiary">
              {[quote.estimatedDuration, quote.availableFrom && `from ${dayLabel(quote.availableFrom)}`].filter(Boolean).join(' · ') || timeAgo(quote.createdAt)}
            </Text>
          </View>
        </View>

        {quote.message ? (
          <ScalePressable onPress={() => setExpanded((e) => !e)} scaleTo={1} accessibilityRole="button" accessibilityHint={expanded ? 'Show less' : 'Show the full message'}>
            <Text variant="body" tone="secondary" numberOfLines={expanded ? undefined : 3}>
              “{quote.message}”
            </Text>
          </ScalePressable>
        ) : null}

        {canDecide && quote.status === 'pending' ? (
          <View style={{ gap: space.sm }}>
            <View style={styles.actions}>
              <Button title="Decline" variant="outline" size="md" onPress={onDecline} style={{ flex: 1 }} />
              <Button title="Accept quote" size="md" icon="checkmark" onPress={onAccept} style={{ flex: 2 }} />
            </View>
            <Button title={`Message ${h.firstName}`} variant="ghost" size="md" icon="chatbubble-ellipses-outline" onPress={onMessage} />
          </View>
        ) : quote.status === 'accepted' ? (
          <Button title={`Message ${h.firstName}`} variant="secondary" size="md" icon="chatbubble-ellipses-outline" onPress={onMessage} />
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actions: { flexDirection: 'row', gap: space.sm },
});
