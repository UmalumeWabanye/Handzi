import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { enter, exit } from './motion';
import { colors, radius, shadow, space } from './theme';

type Props = { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode };

/** Bottom sheet with a dimmed backdrop. Used for pickers and quick choices. */
export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && (
        <View style={styles.root}>
          <Animated.View entering={enter.fade()} exiting={exit.fade()} style={StyleSheet.absoluteFill}>
            <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
          </Animated.View>
          <Animated.View
            entering={enter.sheet()}
            exiting={exit.sheet()}
            style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}
          >
            <View style={styles.grabber} />
            {title && (
              <Text variant="heading" style={{ marginBottom: space.sm }}>
                {title}
              </Text>
            )}
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.screen,
    paddingTop: space.sm,
    gap: space.md,
    ...shadow.sheet,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: space.sm },
});
