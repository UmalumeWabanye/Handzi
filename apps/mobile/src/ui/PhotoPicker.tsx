import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { UploadKind } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { assetSource } from '@/lib/assets';
import { pickImage, PickSource, uploadAsset } from '@/lib/media';
import { Button } from './Button';
import { ScalePressable } from './Pressable';
import { Sheet } from './Sheet';
import { useAccent } from './side';
import { Text } from './Text';
import { enter, exit, layout } from './motion';
import { colors, radius, space } from './theme';
import { useToast } from './Toast';

/** Ask camera vs library, pick, upload. Shared by every photo control. */
export function useUploader(kind: UploadKind, opts: { square?: boolean; frontCamera?: boolean } = {}) {
  const toast = useToast();
  const [choosing, setChoosing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [onDone, setOnDone] = useState<((url: string) => void) | null>(null);

  const start = (cb: (url: string) => void) => {
    setOnDone(() => cb);
    setChoosing(true);
  };

  const run = async (source: PickSource) => {
    setChoosing(false);
    // iOS can't present the picker while the sheet's modal is still dismissing.
    if (Platform.OS === 'ios') await new Promise((r) => setTimeout(r, 400));
    const asset = await pickImage({ source, ...opts });
    if (!asset) return;
    setUploading(true);
    try {
      const { url } = await uploadAsset(asset, kind);
      onDone?.(url);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setUploading(false);
    }
  };

  const sheet = (
    <Sheet visible={choosing} onClose={() => setChoosing(false)} title="Add a photo">
      <Button title="Take a photo" icon="camera-outline" variant="outline" onPress={() => run('camera')} />
      <Button title="Choose from library" icon="images-outline" variant="outline" onPress={() => run('library')} />
    </Sheet>
  );

  return { start, uploading, sheet };
}

type GridProps = { value: string[]; onChange: (urls: string[]) => void; max: number; kind?: UploadKind; error?: string | null };

/** Grid of uploaded photos with an add tile. First photo is the cover. */
export function PhotoGrid({ value, onChange, max, kind = 'portfolio', error }: GridProps) {
  const accent = useAccent();
  const { start, uploading, sheet } = useUploader(kind);
  const canAdd = value.length < max;

  return (
    <View style={{ gap: space.sm }}>
      <Animated.View layout={layout()} style={styles.grid}>
        {value.map((url, i) => (
          <Animated.View key={url} entering={enter.pop()} exiting={exit.pop()} layout={layout()} style={styles.tile}>
            <Image source={assetSource(url)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            {i === 0 && (
              <View style={styles.cover}>
                <Text variant="overline" color="#fff">
                  Cover
                </Text>
              </View>
            )}
            <ScalePressable
              onPress={() => onChange(value.filter((u) => u !== url))}
              style={styles.remove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </ScalePressable>
          </Animated.View>
        ))}
        {canAdd && (
          <ScalePressable
            onPress={() => start((url) => onChange([...value, url]))}
            disabled={uploading}
            style={[styles.tile, styles.add, { borderColor: error ? colors.danger : accent.main, backgroundColor: accent.softer }]}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            {uploading ? (
              <ActivityIndicator color={accent.main} />
            ) : (
              <Animated.View entering={enter.fade()} style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="add" size={26} color={accent.main} />
                <Text variant="caption" color={accent.dark}>
                  {value.length ? 'Add more' : 'Add photos'}
                </Text>
              </Animated.View>
            )}
          </ScalePressable>
        )}
      </Animated.View>
      <Text variant="caption" tone={error ? 'danger' : 'tertiary'}>
        {error ?? `${value.length} of ${max} photos`}
      </Text>
      {sheet}
    </View>
  );
}

type DocProps = { label: string; hint: string; value?: string | null; onChange: (url: string) => void; kind: UploadKind; icon: keyof typeof Ionicons.glyphMap; frontCamera?: boolean };

/** Single document/photo slot (ID, selfie, certificate). */
export function DocumentPicker({ label, hint, value, onChange, kind, icon, frontCamera }: DocProps) {
  const accent = useAccent();
  const { start, uploading, sheet } = useUploader(kind, { frontCamera });
  return (
    <>
      <ScalePressable
        onPress={() => start(onChange)}
        disabled={uploading}
        style={[styles.doc, value ? { borderStyle: 'solid', borderColor: colors.success } : { borderColor: accent.main }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? ', added. Tap to replace' : ''}`}
        scaleTo={0.98}
      >
        {value ? (
          <Image source={assetSource(value)} style={styles.docThumb} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.docThumb, { backgroundColor: accent.softer, alignItems: 'center', justifyContent: 'center' }]}>
            {uploading ? <ActivityIndicator color={accent.main} /> : <Ionicons name={icon} size={26} color={accent.main} />}
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{label}</Text>
          <Text variant="caption" tone="tertiary">
            {value ? 'Added · tap to replace' : hint}
          </Text>
        </View>
        <Ionicons name={value ? 'checkmark-circle' : 'add-circle-outline'} size={24} color={value ? colors.success : accent.main} />
      </ScalePressable>
      {sheet}
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '31.5%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  docThumb: { width: 56, height: 56, borderRadius: radius.sm, overflow: 'hidden' },
});
