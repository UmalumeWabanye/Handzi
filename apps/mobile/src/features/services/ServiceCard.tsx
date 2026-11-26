import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceCard as Card_ } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { placeLabel, servicePrice } from '@/lib/format';
import { Badge, Card, Text, colors, enter, fonts, palette, radius, space } from '@/ui';

const MARK = require('../../../assets/brand/handzi-mark-512.png');

type Props = { s: Card_; index?: number; onPress: () => void; showHandyman?: boolean; showStatus?: boolean };

/** Service package in search results, on profiles and in the handyman's own list. */
export function ServiceCard({ s, index = 0, onPress, showHandyman = true, showStatus }: Props) {
  const h = s.handyman;
  const rating = h.stats?.reviewCount ? `${h.stats.averageRating.toFixed(1)} · ${h.stats.reviewCount} review${h.stats.reviewCount === 1 ? '' : 's'}` : 'New';
  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card onPress={onPress} style={styles.card} accessibilityLabel={`${s.title}, ${servicePrice(s.pricingType, s.fromPrice)}${showHandyman ? `, by ${h.firstName}` : ''}`}>
        <View style={styles.thumb}>
          {s.photo ? (
            <Image source={assetSource(s.photo)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <Image source={MARK} style={styles.mark} contentFit="contain" />
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="tiny" tone="secondary" numberOfLines={1}>
            {s.category.name}
            {s.subcategory ? ` · ${s.subcategory}` : ''}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {s.title}
          </Text>
          {showHandyman && (
            <View style={styles.inline}>
              <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {h.firstName} {h.lastName}
              </Text>
              {h.verified && <Ionicons name="checkmark-circle" size={15} color={colors.success} accessibilityLabel="ID verified" />}
              <Ionicons name="star" size={13} color={colors.star} />
              <Text variant="caption" tone="secondary">
                {rating}
              </Text>
            </View>
          )}
          <View style={styles.bottom}>
            <Text variant="bodyStrong" style={styles.price}>
              {servicePrice(s.pricingType, s.fromPrice)}
            </Text>
            {showStatus ? (
              <Badge label={s.active ? 'Live' : 'Paused'} tone={s.active ? 'success' : 'neutral'} />
            ) : s.distanceKm != null ? (
              <View style={styles.inline}>
                <Ionicons name="location-outline" size={14} color={colors.inkTertiary} />
                <Text variant="caption" tone="secondary">
                  {s.distanceKm < 1 ? 'Nearby' : `${s.distanceKm} km`}
                  {h.place ? ` · ${placeLabel(h.place)}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: space.md },
  thumb: { width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.sunshine, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 40, height: 40 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: 2 },
  price: { fontFamily: fonts.display }, // prices in the display face (BRAND.md §4)
});
