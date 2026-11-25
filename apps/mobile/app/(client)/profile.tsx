import React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useCategories } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { ModeSwitchCard } from '@/features/shared/ModeSwitchCard';
import { TabPage } from '@/features/shared/TabPage';
import { placeLabel } from '@/lib/format';
import { AvatarPicker, ListGroup, ListRow, Section, Text, space, useToast } from '@/ui';

export default function ClientProfile() {
  const { user, updateUser, logout } = useAuth();
  const categories = useCategories();
  const toast = useToast();
  if (!user) return null;

  const interestNames = categories.data?.filter((c) => user.interests?.includes(c._id)).map((c) => c.name) ?? [];

  return (
    <TabPage title="Profile">
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <AvatarPicker
          uri={user.avatar}
          name={`${user.firstName} ${user.lastName}`}
          size={96}
          onChange={async (avatar) => {
            try {
              await updateUser({ avatar });
              toast('Photo updated');
            } catch (e) {
              toast(errorMessage(e), 'error');
            }
          }}
        />
        <Text variant="heading">
          {user.firstName} {user.lastName}
        </Text>
        <Text variant="caption" tone="tertiary">
          {user.phone}
          {user.email ? ` · ${user.email}` : ''}
        </Text>
      </View>

      <ModeSwitchCard />

      <Section title="Preferences">
        <ListGroup>
          <ListRow icon="location-outline" title="Home area" subtitle={placeLabel(user.location) || 'Not set'} onPress={() => router.push('/edit/location')} />
          <ListRow icon="heart-outline" title="Trades you're interested in" subtitle={interestNames.join(', ') || 'None selected'} onPress={() => router.push('/edit/interests')} />
        </ListGroup>
      </Section>

      <Section title="Account">
        <ListGroup>
          <ListRow
            icon="log-out-outline"
            title="Log out"
            tone="danger"
            onPress={() => Alert.alert('Log out?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }])}
          />
        </ListGroup>
      </Section>
    </TabPage>
  );
}
