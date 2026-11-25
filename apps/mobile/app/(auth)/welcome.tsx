import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Mode } from '@handyconnect/shared';
import { useAuth } from '@/context/AuthContext';
import { ScalePressable, Text, colors, enter, palette, radius, shadow, space } from '@/ui';

const LOGO = require('../../assets/brand/logo-stacked-800.png'); // handzi-brand/logo/png, used as-is

type Choice = { side: Mode; icon: keyof typeof Ionicons.glyphMap; title: string; text: string; bg: string; tile: string; tileIcon: string };

// Client card on Brick, handyman card on Charcoal: both approved pairs with white text (BRAND.md §3.3).
const CHOICES: Choice[] = [
  {
    side: 'client',
    icon: 'home',
    title: 'I need a handyman',
    text: 'See their work, compare quotes and pay safely.',
    bg: palette.brick,
    tile: palette.white,
    tileIcon: palette.brick,
  },
  {
    side: 'handyman',
    icon: 'hammer',
    title: "I'm a handyman",
    text: 'Show off your best work and get hired nearby.',
    bg: palette.charcoal,
    tile: palette.sunshine,
    tileIcon: palette.charcoal,
  },
];

function ChoiceCard({ choice, index, onPress }: { choice: Choice; index: number; onPress: () => void }) {
  return (
    <Animated.View entering={enter.up(280 + index * 90, 16)}>
      <ScalePressable
        onPress={onPress}
        hapticFeedback
        style={[styles.card, { backgroundColor: choice.bg }]}
        accessibilityRole="button"
        accessibilityLabel={choice.title}
        accessibilityHint={choice.text}
      >
        <View style={[styles.cardIcon, { backgroundColor: choice.tile }]}>
          <Ionicons name={choice.icon} size={24} color={choice.tileIcon} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="subheading" color={palette.white}>
            {choice.title}
          </Text>
          <Text variant="caption" color={choice.side === 'handyman' ? palette.mist : palette.white}>
            {choice.text}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color={palette.white} />
      </ScalePressable>
    </Animated.View>
  );
}

/** Start screen: the user picks which side of Handzi they're here for. */
export default function Welcome() {
  const { chooseSide } = useAuth();

  const go = (side: Mode) => {
    chooseSide(side);
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Animated.View entering={enter.pop()}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="Handzi" />
        </Animated.View>
        <Animated.View entering={enter.up(120)}>
          <Text variant="heading" center>
            Skilled hands, one tap away.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.choices}>
        <Animated.View entering={enter.up(200)}>
          <Text variant="overline" tone="secondary" center>
            How will you use Handzi?
          </Text>
        </Animated.View>
        {CHOICES.map((c, i) => (
          <ChoiceCard key={c.side} choice={c} index={i} onPress={() => go(c.side)} />
        ))}
        <Animated.View entering={enter.up(460)}>
          <Text variant="caption" tone="secondary" center>
            Already have an account? Pick your side to log in.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between', padding: space.screen },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxl },
  // Stacked logo: min 64px wide; ~40% of screen width like the splash (BRAND.md §2.4, §11).
  logo: { width: 168, height: 186 },
  choices: { gap: space.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.xl, borderRadius: radius.lg, minHeight: 88, ...shadow.sm },
  cardIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
