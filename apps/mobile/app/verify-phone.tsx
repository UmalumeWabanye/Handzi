import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { haptic } from '@/lib/haptics';
import { Banner, Button, CodeInput, Screen, ScreenHeader, Text, colors, enter, radius, space, useAccent } from '@/ui';

const RESEND_SECONDS = 30;

export default function VerifyPhone() {
  const { user, verifyPhone, resendOtp, logout, devCode } = useAuth();
  const accent = useAccent();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const shake = useSharedValue(0);
  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const submit = async (value = code) => {
    if (value.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await verifyPhone(value); // the auth guard moves on to onboarding
      haptic.success();
    } catch (e) {
      haptic.error();
      shake.value = withSequence(withTiming(-8, { duration: 60 }), withTiming(8, { duration: 70 }), withTiming(-4, { duration: 70 }), withTiming(0, { duration: 80 }));
      setError(errorMessage(e));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendOtp();
      setCountdown(RESEND_SECONDS);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader onBack={logout} />}
      footer={<Button title="Verify" onPress={() => submit()} loading={busy} disabled={code.length !== 6} />}
    >
      <Animated.View entering={enter.up()} style={{ gap: space.md }}>
        <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: accent.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.onHighlight} />
        </View>
        <Text variant="title">Enter the code</Text>
        <Text variant="body" tone="secondary">
          We sent a 6-digit code to <Text variant="bodyStrong">{user?.phone}</Text>
        </Text>
      </Animated.View>
      <Animated.View entering={enter.up(100)} style={shaking}>
        <CodeInput value={code} onChange={setCode} onComplete={submit} error={!!error} />
      </Animated.View>
      <Banner tone="danger" message={error} />
      {__DEV__ && devCode ? <Banner tone="info" title={`Dev code: ${devCode}`} message="Shown in development only (no SMS provider yet)." /> : null}
      <Button
        title={countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
        variant="ghost"
        size="md"
        disabled={countdown > 0}
        onPress={resend}
      />
    </Screen>
  );
}
