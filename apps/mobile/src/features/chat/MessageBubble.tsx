import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '@/api/types';
import { assetSource } from '@/lib/assets';
import { ScalePressable, Text, colors, enter, radius, space, useAccent } from '@/ui';

type Props = {
  message: ChatMessage;
  mine: boolean;
  firstInGroup: boolean; // visually the top of a run of messages from the same sender
  lastInGroup: boolean;
  seen?: boolean; // show "Seen" under my latest read message
  animate?: boolean;
  onRetry?: () => void;
  onOpenImage?: (uri: string) => void;
};

const time = (d: string) => new Date(d).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

export function MessageBubble({ message, mine, firstInGroup, lastInGroup, seen, animate, onRetry, onOpenImage }: Props) {
  const accent = useAccent();
  const bg = mine ? accent.main : colors.surface;
  const fg = mine ? '#fff' : colors.ink;
  const corner = mine
    ? { borderTopRightRadius: firstInGroup ? radius.lg : radius.xs, borderBottomRightRadius: lastInGroup ? radius.xs : radius.xs }
    : { borderTopLeftRadius: firstInGroup ? radius.lg : radius.xs, borderBottomLeftRadius: radius.xs };

  return (
    <Animated.View entering={animate ? enter.up(0, 8) : undefined} style={[styles.row, mine ? styles.mine : styles.theirs, { marginTop: firstInGroup ? space.md : 3 }]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: bg, borderColor: mine ? bg : colors.border },
          corner,
          message.images.length > 0 && !message.text && styles.imageOnly,
          message.pending && { opacity: 0.7 },
        ]}
      >
        {message.images.length > 0 && (
          <View style={styles.images}>
            {message.images.map((u) => (
              <ScalePressable key={u} onPress={() => onOpenImage?.(u)} scaleTo={0.97} accessibilityRole="imagebutton" accessibilityLabel="Open photo">
                <Image source={assetSource(u)} style={[styles.image, message.images.length > 1 && styles.imageSmall]} contentFit="cover" transition={200} />
              </ScalePressable>
            ))}
          </View>
        )}
        {message.text ? (
          <Text variant="body" color={fg} selectable>
            {message.text}
          </Text>
        ) : null}
      </View>

      {message.failed ? (
        <ScalePressable onPress={onRetry} style={styles.meta} accessibilityRole="button" accessibilityLabel="Message failed. Tap to retry">
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text variant="caption" tone="danger">
            Not sent · Tap to retry
          </Text>
        </ScalePressable>
      ) : lastInGroup ? (
        <View style={styles.meta}>
          <Text variant="caption" tone="tertiary">
            {message.pending ? 'Sending…' : time(message.createdAt)}
            {mine && seen ? ' · Seen' : ''}
          </Text>
        </View>
      ) : null}

      {message.containsContact && (
        <View style={styles.tip}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.warning} />
          <Text variant="caption" color={colors.warning} style={{ flexShrink: 1 }}>
            Keep payments on Handzi so you're covered if something goes wrong.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { maxWidth: '82%', gap: 4 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: space.md + 2, paddingVertical: space.sm + 2, gap: space.sm },
  imageOnly: { padding: 4 },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  image: { width: 220, height: 220, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  imageSmall: { width: 108, height: 108 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, paddingHorizontal: 4, maxWidth: 260 },
});
