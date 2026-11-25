import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { useNotificationCount } from '@/api/hooks';
import { IconButton, Text, colors, enter, exit, radius } from '@/ui';

/** Bell with an unread badge that pops in when new notifications arrive. */
export function NotificationBell() {
  const { data: count = 0 } = useNotificationCount();
  return (
    <View>
      <IconButton icon="notifications-outline" label={count ? `Notifications, ${count} unread` : 'Notifications'} size={44} onPress={() => router.push('/notifications')} />
      {count > 0 && (
        <Animated.View key={count} entering={enter.pop()} exiting={exit.pop()} style={styles.badge} pointerEvents="none">
          <Text variant="caption" color="#fff" style={{ fontWeight: '700', fontSize: 11 }}>
            {count > 9 ? '9+' : count}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
