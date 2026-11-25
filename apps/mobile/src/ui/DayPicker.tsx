import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { timing } from './motion';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, radius, space } from './theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FILL = timing(200);

/** Noon local time, so the date can't shift a day when converted to UTC. */
const noon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function Day({ date, selected, onPress, index }: { date: Date; selected: boolean; onPress: () => void; index: number }) {
  const accent = useAccent();
  const config = FILL;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? accent.main : colors.surface, config),
    borderColor: withTiming(selected ? accent.main : colors.border, config),
  }));
  const fg = selected ? '#fff' : colors.ink;
  const top = index === 0 ? 'Today' : index === 1 ? 'Tmrw' : DAYS[date.getDay()];
  return (
    <ScalePressable
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`}
    >
      <Animated.View style={[styles.day, fill]}>
        <Text variant="caption" color={selected ? 'rgba(255,255,255,0.85)' : colors.inkTertiary}>
          {top}
        </Text>
        <Text variant="heading" color={fg}>
          {date.getDate()}
        </Text>
        <Text variant="caption" color={selected ? 'rgba(255,255,255,0.85)' : colors.inkTertiary}>
          {MONTHS[date.getMonth()]}
        </Text>
      </Animated.View>
    </ScalePressable>
  );
}

type Props = { label: string; value?: string | null; onChange: (iso: string | null) => void; days?: number; optional?: boolean };

/** Horizontal strip of the next few weeks. Tap the selected day again to clear it. */
export function DayPicker({ label, value, onChange, days = 21, optional }: Props) {
  const list = useMemo(() => {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => noon(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)));
  }, [days]);
  const selected = value ? new Date(value) : null;

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {optional && (
          <Text variant="caption" tone="tertiary">
            {selected ? 'Tap again to clear' : 'Optional'}
          </Text>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.screen }} style={{ marginHorizontal: -space.screen }}>
        {list.map((d, i) => {
          const isSel = !!selected && sameDay(selected, d);
          return (
            <Day
              key={d.toISOString()}
              date={d}
              index={i}
              selected={isSel}
              onPress={() => {
                haptic.select();
                onChange(isSel && optional ? null : d.toISOString());
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  day: { width: 62, paddingVertical: space.md, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', gap: 2 },
});
