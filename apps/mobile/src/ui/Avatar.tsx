import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { assetSource } from '@/lib/assets';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, palette } from './theme';

// Initials on Sunshine with Charcoal text; verified tick in Success (BRAND.md §6).

type Props = { uri?: string | null; name?: string; size?: number; verified?: boolean; ring?: boolean };

export function Avatar({ uri, name = '', size = 48, verified, ring }: Props) {
  const accent = useAccent();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel={name ? `${name}'s photo` : 'Profile photo'}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: accent.soft },
          ring && { borderWidth: 3, borderColor: colors.surface },
        ]}
      >
        {uri ? (
          <Image source={assetSource(uri)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Text variant={size > 64 ? 'title' : 'bodyStrong'} color={colors.onHighlight}>
            {initials || '?'}
          </Text>
        )}
      </View>
      {verified && (
        <View style={[styles.badge, { width: size * 0.34, height: size * 0.34, borderRadius: size }]}>
          <Ionicons name="checkmark-circle" size={size * 0.34} color={palette.success} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
