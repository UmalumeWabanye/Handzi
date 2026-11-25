import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabIcon, tabScreenOptions } from '@/features/shared/TabBar';
import { useChatUnread } from '@/api/hooks';
import { colors, useAccent } from '@/ui';

export default function HandymanTabs() {
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { data: unread = 0 } = useChatUnread('handyman');
  return (
    <Tabs screenOptions={tabScreenOptions(accent.main, insets.bottom)}>
      <Tabs.Screen name="find-work" options={{ title: 'Find Work', tabBarIcon: tabIcon('search') }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: tabIcon('briefcase') }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubbles'),
          tabBarBadge: unread ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#FFFFFF', fontSize: 11 },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle') }} />
    </Tabs>
  );
}
