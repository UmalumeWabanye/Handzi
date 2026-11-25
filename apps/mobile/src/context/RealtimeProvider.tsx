import React, { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { keys } from '@/api/hooks';
import type { AppNotification, ChatMessage, MessagesPage, NotificationData } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { haptic } from '@/lib/haptics';
import { modeFor, notificationHref } from '@/lib/notificationRoute';
import { registerForPush } from '@/lib/push';
import { connectSocket, disconnectSocket, getActiveConversation, useSocketEvent } from '@/lib/socket';
import { useToast } from '@/ui';

/** Insert a message into a conversation's cached pages (newest first), replacing an optimistic copy. */
export function upsertMessage(data: InfiniteData<MessagesPage> | undefined, msg: ChatMessage) {
  if (!data) return data;
  const pages = data.pages.map((p) => ({ ...p, messages: [...p.messages] }));
  for (const page of pages) {
    const i = page.messages.findIndex((m) => m._id === msg._id || (!!msg.clientId && m.clientId === msg.clientId));
    if (i >= 0) {
      page.messages[i] = msg;
      return { ...data, pages };
    }
  }
  if (pages.length) pages[0].messages.unshift(msg);
  else pages.push({ messages: [msg], hasMore: false });
  return { ...data, pages };
}

/**
 * Keeps the app live while signed in: socket connection, cache updates, in-app toasts,
 * push registration and push-tap navigation.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, switchMode } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const onboarded = !!user && user.phoneVerified && user.onboarded[user.activeMode];
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user) return;
    connectSocket();
    // Refresh live data when returning to the app (socket events may have been missed).
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        connectSocket();
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['chat'] });
      }
    });
    return () => sub.remove();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => disconnectSocket(), []);

  // Ask for push permission once the user is set up (not during sign-up).
  useEffect(() => {
    if (onboarded) registerForPush();
  }, [onboarded]);

  const open = useCallback(
    async (type: string | undefined, data: NotificationData) => {
      const href = notificationHref(type, data);
      if (!href) return;
      const switchTo = modeFor(data, userRef.current?.activeMode);
      if (switchTo) {
        await switchMode(switchTo);
        setTimeout(() => router.push(href), 400); // let the guard swap tab sets first
      } else {
        router.push(href);
      }
    },
    [switchMode]
  );

  // Taps on system push notifications (including the one that launched the app).
  useEffect(() => {
    if (!onboarded) return;
    const handle = (r: Notifications.NotificationResponse | null) => {
      const d = r?.notification.request.content.data as (NotificationData & { type?: string; notificationId?: string }) | undefined;
      if (d) open(d.type, d);
    };
    Notifications.getLastNotificationResponseAsync().then((r) => setTimeout(() => handle(r), 500));
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [onboarded, open]);

  useSocketEvent<AppNotification>('notification:new', (n) => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['jobs'] });
    qc.invalidateQueries({ queryKey: ['quotes'] });
    haptic.tap();
    toast(n.body ?? '', 'info', { title: n.title, icon: 'notifications', onPress: () => open(n.type, n.data) });
  });

  useSocketEvent<{ conversationId: string; message: ChatMessage }>('message:new', ({ conversationId, message }) => {
    qc.setQueryData<InfiniteData<MessagesPage>>(keys.messages(conversationId), (d) => upsertMessage(d, message));
    qc.invalidateQueries({ queryKey: ['chat', 'list'] });
    qc.invalidateQueries({ queryKey: ['chat', 'unread'] });
    const mine = message.sender === userRef.current?.id;
    if (!mine && getActiveConversation() !== conversationId) {
      haptic.tap();
      toast(message.text || 'Sent a photo', 'info', {
        title: 'New message',
        icon: 'chatbubble-ellipses',
        onPress: () => router.push({ pathname: '/chat/[id]', params: { id: conversationId } }),
      });
    }
  });

  useSocketEvent<{ conversationId: string; by: string }>('conversation:read', ({ conversationId, by }) => {
    qc.setQueryData<InfiniteData<MessagesPage>>(keys.messages(conversationId), (d) =>
      d ? { ...d, pages: d.pages.map((p) => ({ ...p, messages: p.messages.map((m) => (m.readBy.includes(by) ? m : { ...m, readBy: [...m.readBy, by] })) })) } : d
    );
  });

  return <>{children}</>;
}
