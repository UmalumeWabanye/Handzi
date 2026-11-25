import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, Text, accents, radius, space, useToast } from '@/ui';
import { ActivityIndicator } from 'react-native';

/** Fiverr-style switch between hiring (client) and working (handyman). */
export function ModeSwitchCard() {
  const { user, switchMode, becomeHandyman } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const toHandyman = user.activeMode === 'client';
  const target = accents[toHandyman ? 'handyman' : 'client'];
  const hasHandymanRole = user.roles.includes('handyman');

  const onPress = async () => {
    setBusy(true);
    try {
      // The auth guard swaps the tab set (or opens onboarding) once the mode changes.
      if (toHandyman && !hasHandymanRole) await becomeHandyman();
      else await switchMode(toHandyman ? 'handyman' : 'client');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const title = toHandyman ? (hasHandymanRole ? 'Switch to handyman mode' : 'Become a handyman') : 'Switch to hiring';
  const text = toHandyman
    ? hasHandymanRole
      ? 'Find work, send quotes and manage your jobs.'
      : 'Offer your trade, build your profile and start earning.'
    : 'Post jobs and book handymen for your own home.';

  return (
    <Card onPress={busy ? undefined : onPress} style={styles.card} accessibilityLabel={title}>
      <View style={[styles.icon, { backgroundColor: target.softer }]}>
        {busy ? <ActivityIndicator color={target.main} /> : <Ionicons name={toHandyman ? 'hammer' : 'home'} size={22} color={target.main} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subheading">{title}</Text>
        <Text variant="caption" tone="tertiary">
          {text}
        </Text>
      </View>
      <Ionicons name="swap-horizontal" size={20} color={target.main} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
