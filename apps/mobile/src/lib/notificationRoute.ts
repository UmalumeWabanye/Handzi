import type { Href } from 'expo-router';
import type { Mode } from '@handyconnect/shared';
import type { NotificationData } from '@/api/types';

/** Where tapping a notification should take the user. */
export function notificationHref(type: string | undefined, data: NotificationData): Href | null {
  if (type === 'message' && data.conversationId) return { pathname: '/chat/[id]', params: { id: data.conversationId } };
  if (type === 'verification_approved' || type === 'verification_rejected') return '/edit/verification';
  if (data.bookingId) return { pathname: '/booking/[id]', params: { id: data.bookingId } };
  if (!data.jobId) return null;
  return data.mode === 'client' ? { pathname: '/jobs/[id]', params: { id: data.jobId } } : { pathname: '/work/[id]', params: { id: data.jobId } };
}

/** Notifications are for a specific side of the app; returns the side to switch to first, if any. */
export const modeFor = (data: NotificationData, current: Mode | undefined): Mode | null =>
  data.mode && current && data.mode !== current ? data.mode : null;
