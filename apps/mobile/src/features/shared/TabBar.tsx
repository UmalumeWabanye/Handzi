import React from 'react';
import type { ColorValue } from 'react-native';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from 'expo-router/build/layouts/Tabs';
import { fonts, palette, type as typeScale } from '@/ui';

type Icon = keyof typeof Ionicons.glyphMap;

/** Filled icon when focused, outline otherwise: same rule on both sides of the app. */
export const tabIcon =
  (name: Icon) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={(focused ? name : `${name}-outline`) as Icon} color={color as string} size={size} />
  );

/**
 * Android draws apps edge-to-edge, so the system navigation bar (gesture pill or 3-button bar) sits on top
 * of the app. The tab bar must grow by that inset or its buttons end up hidden underneath it.
 */
// BRAND.md §6: Charcoal tab bar, Mist icons, active tab in Sunshine. (`_accent` kept for call sites.)
export const tabScreenOptions = (_accent: string, bottomInset: number): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: palette.sunshine,
  tabBarInactiveTintColor: palette.mist,
  tabBarLabelStyle: { ...typeScale.tiny, fontFamily: fonts.semibold },
  tabBarIconStyle: { marginTop: 2 },
  tabBarStyle: {
    backgroundColor: palette.charcoal,
    borderTopColor: palette.charcoal,
    ...(Platform.OS === 'android' ? { height: 58 + bottomInset, paddingTop: 6, paddingBottom: Math.max(bottomInset, 8) } : {}),
  },
  animation: 'fade', // cross-fade between tabs; sliding whole screens sideways feels heavy
});
