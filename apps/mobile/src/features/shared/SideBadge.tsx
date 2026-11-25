import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, colors, radius, space, useAccent, useSide } from '@/ui';

/** Pill telling the user which side of the platform they're signing into. */
export function SideBadge() {
  const side = useSide();
  const accent = useAccent();
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, backgroundColor: accent.soft, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill }}>
      <Ionicons name={side === 'handyman' ? 'hammer' : 'home'} size={14} color={colors.onHighlight} />
      <Text variant="label" color={colors.onHighlight}>
        {side === 'handyman' ? 'Handyman account' : 'Hiring account'}
      </Text>
    </View>
  );
}
