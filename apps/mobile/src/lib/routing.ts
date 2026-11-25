import type { Href } from 'expo-router';
import type { User } from '@/api/types';

/** Where a user belongs right now, given auth, verification and onboarding state. */
export function homeHref(user: User | null): Href {
  if (!user) return '/welcome';
  if (!user.phoneVerified) return '/verify-phone';
  if (user.activeMode === 'handyman') return user.onboarded.handyman ? '/find-work' : '/onboarding/handyman';
  return user.onboarded.client ? '/home' : '/onboarding/client';
}
