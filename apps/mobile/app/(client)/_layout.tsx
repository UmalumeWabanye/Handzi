import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabIcon, tabScreenOptions } from '@/features/shared/TabBar';
import { useChatUnread } from '@/api/hooks';
import { colors, useAccent } from '@/ui';

export default function ClientTabs() {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { data: unread = 0 } = useChatUnread('client');
  return (
    <Tabs screenOptions={tabScreenOptions(accent.main, insets.bottom)}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="jobs" options={{ title: 'My Jobs', tabBarIcon: tabIcon('clipboard') }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubbles'),
          tabBarBadge: unread ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#FFFFFF', fontSize: 11 },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
