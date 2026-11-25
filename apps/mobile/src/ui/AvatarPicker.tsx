import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { useUploader } from './PhotoPicker';
import { ScalePressable } from './Pressable';
import { useAccent } from './side';
import { Text } from './Text';
import { colors, space } from './theme';

type Props = { uri?: string | null; name: string; onChange: (url: string) => void; size?: number; caption?: string };

export function AvatarPicker({ uri, name, onChange, size = 112, caption }: Props) {
  const accent = useAccent();
  const { start, uploading, sheet } = useUploader('avatar', { square: true, frontCamera: true });
  return (
    <View style={styles.wrap}>
      <ScalePressable onPress={() => start(onChange)} accessibilityRole="button" accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'} scaleTo={0.95}>
        <Avatar uri={uri} name={name} size={size} />
        <View style={[styles.edit, { backgroundColor: accent.main }]}>
          {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name={uri ? 'pencil' : 'camera'} size={16} color="#fff" />}
        </View>
      </ScalePressable>
      {caption && (
        <Text variant="caption" tone="tertiary" center>
          {caption}
        </Text>
      )}
      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  edit: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
});
