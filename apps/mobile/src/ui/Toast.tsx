import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { enter, exit } from './motion';
import { ScalePressable } from './Pressable';
import { Text } from './Text';
import { palette, radius, shadow, space } from './theme';

type Tone = 'success' | 'error' | 'info';
type Options = { title?: string; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap; duration?: number };
type ToastState = ({ id: number; message: string; tone: Tone } & Options) | null;
type Show = (message: string, tone?: Tone, options?: Options) => void;

const ToastContext = createContext<Show>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback<Show>((message, tone = 'success', options = {}) => {
    if (timer.current) clearTimeout(timer.current);
    if (tone === 'error') haptic.error();
    setToast({ id: Date.now(), message, tone, ...options });
    timer.current = setTimeout(() => setToast(null), options.duration ?? (options.onPress ? 4200 : 2600));
  }, []);

  const icon = toast?.icon ?? (toast?.tone === 'error' ? 'alert-circle' : toast?.tone === 'info' ? 'information-circle' : 'checkmark-circle');
  // On Charcoal: Sunshine for good news, Safety Orange for problems, Mist for info (BRAND.md §3, §10).
  const iconColor = toast?.tone === 'error' ? palette.orange : toast?.tone === 'info' ? palette.mist : palette.sunshine;

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + space.sm }]}>
        {toast && (
          <Animated.View key={toast.id} entering={enter.fromTop()} exiting={exit.toTop()} accessibilityLiveRegion="polite">
            <ScalePressable
              disabled={!toast.onPress}
              onPress={() => {
                setToast(null);
                toast.onPress?.();
              }}
              scaleTo={0.98}
              style={styles.toast}
              accessibilityRole={toast.onPress ? 'button' : 'alert'}
            >
              <Ionicons name={icon} size={20} color={iconColor} />
              <View style={{ flex: 1 }}>
                {toast.title && (
                  <Text variant="label" color={palette.white} numberOfLines={1}>
                    {toast.title}
                  </Text>
                )}
                <Text variant={toast.title ? 'caption' : 'bodyStrong'} color={toast.title ? palette.mist : palette.white} numberOfLines={2}>
                  {toast.message}
                </Text>
              </View>
              {toast.onPress && <Ionicons name="chevron-forward" size={18} color={palette.mist} />}
            </ScalePressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.charcoal,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    ...shadow.md,
    borderWidth: 1,
    borderColor: palette.graphite,
  },
});
