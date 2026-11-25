import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MESSAGE_MAX_IMAGES } from '@handyconnect/shared';
import { assetSource } from '@/lib/assets';
import { IconButton, ScalePressable, colors, enter, exit, layout, radius, space, timing, type, useAccent, useUploader } from '@/ui';

type Props = { onSend: (text: string, images: string[]) => void; onTyping: () => void; bottomInset: number };

const FILL = timing(160);

/** Message input: multi-line text, photo attachments, animated send button. */
export function Composer({ onSend, onTyping, bottomInset }: Props) {
  const accent = useAccent();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const lastTyping = useRef(0);
  const { start, uploading, sheet } = useUploader('message');
  const canSend = (text.trim().length > 0 || images.length > 0) && !uploading;

  const config = FILL;
  const sendStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(canSend ? accent.main : colors.surfaceMuted, config),
    transform: [{ scale: withTiming(canSend ? 1 : 0.92, config) }],
  }));

  const send = () => {
    if (!canSend) return;
    onSend(text.trim(), images);
    setText('');
    setImages([]);
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(bottomInset, space.sm) }]}>
      {images.length > 0 && (
        <Animated.View layout={layout()} style={styles.staged}>
          {images.map((u) => (
            <Animated.View key={u} entering={enter.pop()} exiting={exit.pop()} layout={layout()}>
              <Image source={assetSource(u)} style={styles.thumb} contentFit="cover" />
              <ScalePressable onPress={() => setImages((cur) => cur.filter((x) => x !== u))} style={styles.remove} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove photo">
                <Ionicons name="close" size={14} color="#fff" />
              </ScalePressable>
            </Animated.View>
          ))}
        </Animated.View>
      )}
      <View style={styles.row}>
        {uploading ? (
          <View style={styles.attach}>
            <ActivityIndicator color={accent.main} />
          </View>
        ) : (
          <IconButton
            icon="camera-outline"
            label="Add a photo"
            color={accent.main}
            onPress={() => images.length < MESSAGE_MAX_IMAGES && start((url) => setImages((cur) => [...cur, url]))}
          />
        )}
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            const now = Date.now();
            if (t && now - lastTyping.current > 2500) {
              lastTyping.current = now;
              onTyping();
            }
          }}
          placeholder="Message"
          placeholderTextColor={colors.inkDisabled}
          selectionColor={accent.main}
          multiline
          maxLength={4000}
          style={styles.input}
          accessibilityLabel="Message"
        />
        <ScalePressable onPress={send} disabled={!canSend} scaleTo={0.9} hapticFeedback accessibilityRole="button" accessibilityLabel="Send" accessibilityState={{ disabled: !canSend }}>
          <Animated.View style={[styles.send, sendStyle]}>
            <Ionicons name="arrow-up" size={22} color={canSend ? '#fff' : colors.inkDisabled} />
          </Animated.View>
        </ScalePressable>
      </View>
      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.md, paddingTop: space.sm, gap: space.sm, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  attach: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: space.md + 2,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  staged: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.xs },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  remove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
