import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Import only the weights the brand uses (the package roots would bundle every weight and italic).
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RealtimeProvider } from '@/context/RealtimeProvider';
import { SideProvider, ToastProvider, colors } from '@/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function RootNavigator() {
  const { user, ready: sessionReady, side } = useAuth();
  // Brand fonts (BRAND.md §4): Bricolage Grotesque 800 for headings, Inter for everything else.
  const [fontsLoaded, fontError] = useFonts({ BricolageGrotesque_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const ready = sessionReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null; // native splash stays up while the session and fonts load

  const signedIn = !!user;
  const verified = signedIn && user.phoneVerified;
  const mode = user?.activeMode;
  const onboarded = verified && !!mode && user.onboarded[mode];

  return (
    <SideProvider side={side}>
      <ToastProvider>
        <RealtimeProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 300, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />

            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            </Stack.Protected>

            <Stack.Protected guard={signedIn && !verified}>
              <Stack.Screen name="verify-phone" options={{ animation: 'fade' }} />
            </Stack.Protected>

            {/* Each side has its own onboarding, shown until that side is set up */}
            <Stack.Protected guard={verified && mode === 'client' && !onboarded}>
              <Stack.Screen name="onboarding/client" options={{ animation: 'fade', gestureEnabled: false }} />
            </Stack.Protected>
            <Stack.Protected guard={verified && mode === 'handyman' && !onboarded}>
              <Stack.Screen name="onboarding/handyman" options={{ animation: 'fade', gestureEnabled: false }} />
            </Stack.Protected>

            <Stack.Protected guard={onboarded && mode === 'client'}>
              <Stack.Screen name="(client)" options={{ animation: 'fade' }} />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && mode === 'handyman'}>
              <Stack.Screen name="(handyman)" options={{ animation: 'fade' }} />
            </Stack.Protected>

            {/* Jobs: clients post and review quotes; handymen browse and quote */}
            <Stack.Protected guard={onboarded && mode === 'client'}>
              <Stack.Screen name="services" />
            <Stack.Screen name="post-job" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
              <Stack.Screen name="jobs/[id]" />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && mode === 'handyman'}>
              <Stack.Screen name="work/[id]" />
            <Stack.Screen name="earnings" />
              <Stack.Screen name="quote/[jobId]" options={{ presentation: 'modal' }} />
            </Stack.Protected>

            <Stack.Protected guard={onboarded}>
              <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="service/[id]" />
            <Stack.Screen name="booking/[id]" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="handyman/[id]/index" />
              <Stack.Screen name="handyman/[id]/project/[projectId]" options={{ animation: 'fade_from_bottom' }} />
              <Stack.Screen name="edit/[section]" />
            </Stack.Protected>

            {/* Work history / project / certificate editors: used during onboarding and from the profile */}
            <Stack.Protected guard={verified && mode === 'handyman'}>
              <Stack.Screen name="editor/work" options={{ presentation: 'modal' }} />
              <Stack.Screen name="editor/project" options={{ presentation: 'modal' }} />
              <Stack.Screen name="editor/certification" options={{ presentation: 'modal' }} />
            <Stack.Screen name="service-editor" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
        </RealtimeProvider>
      </ToastProvider>
    </SideProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
