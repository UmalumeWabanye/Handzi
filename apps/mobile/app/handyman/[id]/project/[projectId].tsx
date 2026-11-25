import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePublicHandyman } from '@/api/hooks';
import type { CategoryRef } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { monthYear } from '@/lib/format';
import { Avatar, Badge, Card, EmptyState, IconButton, Text, colors, enter, space, timing, useAccent } from '@/ui';

const DOT_TIMING = timing();

function Dot({ active }: { active: boolean }) {
  const accent = useAccent();
  const config = DOT_TIMING;
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 20 : 7, config),
    backgroundColor: withTiming(active ? accent.main : colors.borderStrong, config),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

/** Full project view with a swipeable photo gallery. */
export default function ProjectDetail() {
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId: string }>();
  const { data } = usePublicHandyman(id);
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const project = data?.portfolio.find((p) => p._id === projectId);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };
  const category = project?.category && typeof project.category === 'object' ? (project.category as CategoryRef) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
      </View>
      {!project || !data ? (
        <EmptyState icon="images-outline" title="Project not found" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: space.huge }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} decelerationRate="fast">
            {project.photos.map((p, i) => (
              <Image key={p} source={assetSource(p)} style={{ width, height: width }} contentFit="cover" transition={250} accessibilityLabel={`Photo ${i + 1} of ${project.photos.length}`} />
            ))}
          </ScrollView>
          {project.photos.length > 1 && (
            <View style={styles.dots}>
              {project.photos.map((p, i) => (
                <Dot key={p} active={i === page} />
              ))}
            </View>
          )}
          <Animated.View entering={enter.up(60)} style={styles.body}>
            {category && <Badge label={category.name} tone="accent" />}
            <Text variant="title">{project.title}</Text>
            <View style={styles.meta}>
              {project.location ? (
                <View style={styles.inline}>
                  <Ionicons name="location-outline" size={15} color={colors.inkTertiary} />
                  <Text variant="caption" tone="tertiary">
                    {project.location}
                  </Text>
                </View>
              ) : null}
              {project.completedOn ? (
                <View style={styles.inline}>
                  <Ionicons name="calendar-outline" size={15} color={colors.inkTertiary} />
                  <Text variant="caption" tone="tertiary">
                    Completed {monthYear(project.completedOn)}
                  </Text>
                </View>
              ) : null}
            </View>
            {project.description ? (
              <Text variant="body" tone="secondary">
                {project.description}
              </Text>
            ) : null}
            <Card onPress={() => router.back()} style={styles.by} accessibilityLabel={`Back to ${data.firstName}'s profile`}>
              <Avatar uri={data.avatar} name={`${data.firstName} ${data.lastName}`} size={44} verified={data.verified} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {data.firstName} {data.lastName}
                </Text>
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {data.headline}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkDisabled} />
            </Card>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: space.lg, paddingTop: space.xxxl + space.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.md },
  dot: { height: 7, borderRadius: 4 },
  body: { padding: space.xl, gap: space.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  by: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
});
