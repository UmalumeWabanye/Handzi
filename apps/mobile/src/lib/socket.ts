import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { API_ORIGIN } from '@/api/config';
import { api } from '@/api/client';
import { tokenStore } from '@/api/tokens';

type Listener = (payload: unknown) => void;

let socket: Socket | null = null;
let activeConversation: string | null = null;
// Listeners live here (not on the socket) so screens can subscribe before/without a connection.
const listeners = new Map<string, Set<Listener>>();

/** Connect with the current access token (re-read on every reconnect). Only call while signed in. */
export function connectSocket() {
  if (!tokenStore.getAccess()) return null;
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(API_ORIGIN, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: tokenStore.getAccess() }),
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  socket.onAny((event: string, payload: unknown) => listeners.get(event)?.forEach((fn) => fn(payload)));
  socket.on('connect_error', async (err) => {
    if (err.message !== 'unauthorized') return;
    // Access token expired: any authenticated call refreshes it (see api/client), then retry once.
    try {
      await api.get('/auth/me');
      socket?.connect();
    } catch {
      disconnectSocket(); // session is gone; AuthContext logs out
    }
  });
  socket.on('connect', () => {
    if (activeConversation) socket?.emit('conversation:focus', { conversationId: activeConversation });
  });
  return socket;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  activeConversation = null;
}

export const emit = (event: string, payload: unknown) => socket?.emit(event, payload);

/** Tell the server which chat is on screen, so it doesn't push notifications for it. */
export function setActiveConversation(id: string | null) {
  if (activeConversation && activeConversation !== id) emit('conversation:blur', { conversationId: activeConversation });
  activeConversation = id;
  if (id) emit('conversation:focus', { conversationId: id });
}
export const getActiveConversation = () => activeConversation;

/** Subscribe to a server event for the lifetime of a component. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn: Listener = (p) => ref.current(p as T);
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    return () => {
      listeners.get(event)?.delete(fn);
    };
  }, [event]);
}
