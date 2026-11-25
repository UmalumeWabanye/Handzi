import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { assetSource } from '@/lib/assets';
import { timing } from './motion';
import { useAccent } from './side';
import { colors, space } from './theme';

const DOT = timing();

function Dot({ active }: { active: boolean }) {
  const accent = useAccent();
  const config = DOT;
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 20 : 7, config),
    backgroundColor: withTiming(active ? accent.main : colors.borderStrong, config),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

/** Full-width swipeable photos with animated page dots. */
export function PhotoCarousel({ photos, width, height }: { photos: string[]; width: number; height: number }) {
  const [page, setPage] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };
  if (!photos.length) return null;
  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} decelerationRate="fast">
        {photos.map((p, i) => (
          <Image
            key={p}
            source={assetSource(p)}
            style={{ width, height, backgroundColor: colors.surfaceMuted }}
            contentFit="cover"
            transition={250}
            accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
          />
        ))}
      </ScrollView>
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <Dot key={p} active={i === page} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.md },
  dot: { height: 7, borderRadius: 4 },
});
