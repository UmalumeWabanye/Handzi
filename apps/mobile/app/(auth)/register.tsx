import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { SideBadge } from '@/features/shared/SideBadge';
import { Banner, Button, Screen, ScreenHeader, Text, TextField, enter, space, useAccent, ScalePressable } from '@/ui';

export default function Register() {
  const { register, side } = useAuth();
  const accent = useAccent();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = { lastName: useRef<TextInputInstance>(null), phone: useRef<TextInputInstance>(null), email: useRef<TextInputInstance>(null), password: useRef<TextInputInstance>(null) };

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const valid = form.firstName.trim() && form.lastName.trim() && form.phone.trim() && form.password.length >= 8;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    setBusy(true);
    try {
      // The auth guard moves to phone verification as soon as the session exists.
      await register({ ...form, email: form.email.trim() || undefined });
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
          <Button title="Create account" onPress={submit} loading={busy} disabled={!valid} />
          <ScalePressable onPress={() => router.replace('/login')} accessibilityRole="button" style={{ alignSelf: 'center', padding: space.sm }}>
            <Text variant="body" tone="secondary">
              Already have an account?{' '}
              <Text variant="bodyStrong" color={accent.main}>
                Log in
              </Text>
            </Text>
          </ScalePressable>
        </>
      }
    >
      <Animated.View entering={enter.up()} style={{ gap: space.md }}>
        <SideBadge />
        <Text variant="title">{side === 'handyman' ? 'Start getting hired' : 'Get things fixed'}</Text>
        <Text variant="body" tone="secondary">
          {side === 'handyman'
            ? "Create your account, then we'll help you build a profile clients can trust."
            : 'Create your account to post jobs and hire verified handymen near you.'}
        </Text>
      </Animated.View>
      <Banner tone="danger" message={error} />
      <Animated.View entering={enter.up(90)} style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <TextField label="First name" value={form.firstName} onChangeText={set('firstName')} autoComplete="given-name" textContentType="givenName" returnKeyType="next" onSubmitEditing={() => refs.lastName.current?.focus()} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField ref={refs.lastName} label="Last name" value={form.lastName} onChangeText={set('lastName')} autoComplete="family-name" textContentType="familyName" returnKeyType="next" onSubmitEditing={() => refs.phone.current?.focus()} />
          </View>
        </View>
        <TextField
          ref={refs.phone}
          label="Mobile number"
          icon="call-outline"
          value={form.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          placeholder="082 123 4567"
          hint="We'll SMS you a code to confirm it's you."
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
        <TextField
          ref={refs.email}
          label="Email"
          optional
          icon="mail-outline"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => refs.password.current?.focus()}
        />
        <TextField
          ref={refs.password}
          label="Password"
          icon="lock-closed-outline"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          hint="At least 8 characters."
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Text variant="caption" tone="tertiary">
          By creating an account you agree to the Handzi Terms and Privacy Policy.
        </Text>
      </Animated.View>
    </Screen>
  );
}
