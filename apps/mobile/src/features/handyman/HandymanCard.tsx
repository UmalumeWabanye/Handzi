import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { HandymanCard as Card_ } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { placeLabel, rand } from '@/lib/format';
import { Avatar, Badge, Card, Text, colors, enter, space } from '@/ui';

export function HandymanCard({ h, onPress, index = 0 }: { h: Card_; onPress: () => void; index?: number }) {
  const name = `${h.firstName} ${h.lastName}`;
  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card padded={false} onPress={onPress} accessibilityLabel={`${name}, ${h.headline ?? ''}`} style={{ overflow: 'hidden' }}>
        {h.coverPhoto && <Image source={assetSource(h.coverPhoto)} style={styles.cover} contentFit="cover" transition={250} />}
        <View style={styles.body}>
          <View style={styles.row}>
            <Avatar uri={h.avatar} name={name} size={52} verified={h.verified} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="subheading" numberOfLines={1}>
                {name}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={2}>
                {h.headline}
              </Text>
            </View>
          </View>
          <View style={styles.meta}>
            {h.stats.reviewCount > 0 ? (
              <View style={styles.inline}>
                <Ionicons name="star" size={14} color={colors.star} />
                <Text variant="label">{h.stats.averageRating.toFixed(1)}</Text>
                <Text variant="caption" tone="tertiary">
                  ({h.stats.reviewCount})
                </Text>
              </View>
            ) : (
              <Badge label="New" tone="accent" />
            )}
            {h.verified && <Badge label="Verified" tone="success" icon="shield-checkmark" />}
            {h.yearsExperience > 0 && (
              <Text variant="caption" tone="tertiary">
                {h.yearsExperience} yrs
              </Text>
            )}
            <View style={{ flex: 1 }} />
            {h.hourlyRate ? <Text variant="label">{rand(h.hourlyRate)}/hr</Text> : null}
          </View>
          <View style={styles.inline}>
            <Ionicons name="location-outline" size={14} color={colors.inkTertiary} />
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {[placeLabel(h.place), h.distanceKm != null && `${h.distanceKm} km away`].filter(Boolean).join(' · ') || 'South Africa'}
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 130, backgroundColor: colors.surfaceMuted },
  body: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
