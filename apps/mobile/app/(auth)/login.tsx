import React, { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { SideBadge } from '@/features/shared/SideBadge';
import { Banner, Button, ScalePressable, Screen, ScreenHeader, Text, TextField, enter, space, useAccent } from '@/ui';

export default function Login() {
  const { login, side } = useAuth();
  const accent = useAccent();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (!identifier || !password) return;
    setError(null);
    setBusy(true);
    try {
      // The auth guard routes to the right place as soon as the session exists.
      await login(identifier.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader />}
      footer={
        <>
          <Button title="Log in" onPress={submit} loading={busy} disabled={!identifier || !password} />
          <ScalePressable onPress={() => router.replace('/register')} accessibilityRole="button" style={{ alignSelf: 'center', padding: space.sm }}>
            <Text variant="body" tone="secondary">
              New to Handzi?{' '}
              <Text variant="bodyStrong" color={accent.main}>
                Create an account
              </Text>
            </Text>
          </ScalePressable>
        </>
      }
    >
      <Animated.View entering={enter.up()} style={{ gap: space.md }}>
        <SideBadge />
        <Text variant="title">Welcome back</Text>
        <Text variant="body" tone="secondary">
          {side === 'handyman' ? 'Log in to find work and manage your jobs.' : 'Log in to manage your jobs and bookings.'}
        </Text>
      </Animated.View>
      <Banner tone="danger" message={error} />
      <Animated.View entering={enter.up(90)} style={{ gap: space.lg }}>
        <TextField
          label="Mobile number or email"
          icon="person-outline"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="082 123 4567"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </Animated.View>
    </Screen>
  );
}
