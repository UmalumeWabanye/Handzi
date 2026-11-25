import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { chatApi, reportApi } from '@/api/endpoints';
import { keys, useConversation, useMessages } from '@/api/hooks';
import type { ChatMessage, MessagesPage } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { upsertMessage } from '@/context/RealtimeProvider';
import { Composer } from '@/features/chat/Composer';
import { MessageBubble } from '@/features/chat/MessageBubble';
import { TypingDots } from '@/features/chat/TypingDots';
import { assetSource } from '@/lib/assets';
import { dayLabel } from '@/lib/format';
import { emit, setActiveConversation, useSocketEvent } from '@/lib/socket';
import { Avatar, Banner, Button, IconButton, ScalePressable, Sheet, Skeleton, Text, colors, enter, exit, space, useToast } from '@/ui';

const GROUP_GAP_MS = 5 * 60 * 1000;
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const newId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const me = user?.id ?? '';
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const conv = useConversation(id);
  const msgs = useMessages(id);
  const [typing, setTyping] = useState(false);
  const [menu, setMenu] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstLoad = useRef(true);

  const c = conv.data;
  const name = c?.other ? `${c.other.firstName} ${c.other.lastName}` : '';
  const messages = useMemo(() => msgs.data?.pages.flatMap((p) => p.messages) ?? [], [msgs.data]);

  // This chat is on screen: suppress pushes for it and mark it read.
  const markRead = useCallback(() => {
    chatApi.markRead(id).then(() => qc.invalidateQueries({ queryKey: ['chat', 'unread'] }), () => {});
  }, [id, qc]);
  useEffect(() => {
    setActiveConversation(id);
    markRead();
    return () => setActiveConversation(null);
  }, [id, markRead]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (msgs.data) firstLoad.current = false;
  }, [msgs.data]);

  useSocketEvent<{ conversationId: string; message: ChatMessage }>('message:new', ({ conversationId, message }) => {
    if (conversationId !== id || message.sender === me) return;
    setTyping(false);
    markRead();
  });
  useSocketEvent<{ conversationId: string }>('typing', ({ conversationId }) => {
    if (conversationId !== id) return;
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 3500);
  });

  const setMessages = (fn: (d: InfiniteData<MessagesPage> | undefined) => InfiniteData<MessagesPage> | undefined) =>
    qc.setQueryData<InfiniteData<MessagesPage>>(keys.messages(id), fn);

  const send = async (text: string, images: string[], retryOf?: ChatMessage) => {
    const clientId = retryOf?.clientId ?? newId();
    const optimistic: ChatMessage = {
      _id: clientId,
      clientId,
      conversation: id,
      sender: me,
      text: text || undefined,
      images,
      readBy: [me],
      containsContact: false,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((d) => upsertMessage(d ?? { pages: [{ messages: [], hasMore: false }], pageParams: [undefined] }, optimistic));
    try {
      const saved = await chatApi.send(id, { text: text || undefined, images, clientId });
      setMessages((d) => upsertMessage(d, saved));
      qc.invalidateQueries({ queryKey: ['chat', 'list'] });
    } catch (e) {
      setMessages((d) => upsertMessage(d, { ...optimistic, pending: false, failed: true }));
      toast(errorMessage(e), 'error');
    }
  };

  // Index of my newest message the other person has read (for "Seen").
  const seenIndex = useMemo(() => {
    const otherId = c?.other?.id;
    return messages.findIndex((m) => m.sender === me && !!otherId && m.readBy.includes(otherId));
  }, [messages, me, c?.other?.id]);

  const report = () =>
    Alert.alert(`Report ${c?.other?.firstName}?`, 'Our team will review this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          setMenu(false);
          if (!c?.other) return;
          await reportApi.create('user', c.other.id, `Reported from chat ${id}`).catch(() => {});
          toast('Thanks, our team will take a look', 'info');
        },
      },
    ]);

  const toggleBlock = async () => {
    setMenu(false);
    try {
      const next = c?.blockedByMe ? await chatApi.unblock(id) : await chatApi.block(id);
      qc.setQueryData(keys.conversation(id), next);
      qc.invalidateQueries({ queryKey: ['chat', 'list'] });
      toast(next.blockedByMe ? `${c?.other?.firstName} is blocked` : 'Unblocked', 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    // The list is inverted: index 0 is the newest message (bottom of the screen).
    const newer = messages[index - 1];
    const older = messages[index + 1];
    const mine = item.sender === me;
    const groupedWithOlder = !!older && older.sender === item.sender && +new Date(item.createdAt) - +new Date(older.createdAt) < GROUP_GAP_MS && sameDay(older.createdAt, item.createdAt);
    const groupedWithNewer = !!newer && newer.sender === item.sender && +new Date(newer.createdAt) - +new Date(item.createdAt) < GROUP_GAP_MS && sameDay(newer.createdAt, item.createdAt);
    const showDay = !older || !sameDay(older.createdAt, item.createdAt);
    return (
      <View>
        {showDay && (
          <Text variant="caption" tone="tertiary" center style={styles.day}>
            {dayLabel(item.createdAt)}
          </Text>
        )}
        <MessageBubble
          message={item}
          mine={mine}
          firstInGroup={!groupedWithOlder}
          lastInGroup={!groupedWithNewer}
          seen={index === seenIndex}
          animate={!firstLoad.current && index === 0}
          onRetry={() => send(item.text ?? '', item.images, item)}
          onOpenImage={setViewer}
        />
      </View>
    );
  };

  const header = (
    <View style={styles.header}>
      <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
      {c ? (
        <ScalePressable
          style={styles.who}
          scaleTo={0.98}
          disabled={c.role !== 'client' || !c.other}
          onPress={() => c.other && router.push({ pathname: '/handyman/[id]', params: { id: c.other.id } })}
          accessibilityRole="button"
          accessibilityLabel={c.role === 'client' ? `View ${name}'s profile` : name}
        >
          <Avatar uri={c.other?.avatar} name={name} size={40} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {typing ? 'typing…' : c.job ? `Re: ${c.job.title}` : ' '}
            </Text>
          </View>
        </ScalePressable>
      ) : (
        <Skeleton height={40} width="60%" />
      )}
      <IconButton icon="ellipsis-horizontal" label="More options" onPress={() => setMenu(true)} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {msgs.isLoading ? (
          <View style={{ flex: 1, padding: space.xl, gap: space.md, justifyContent: 'flex-end' }}>
            <Skeleton height={44} width="60%" />
            <Skeleton height={44} width="45%" style={{ alignSelf: 'flex-end' }} />
            <Skeleton height={64} width="70%" />
          </View>
        ) : msgs.error ? (
          <View style={{ flex: 1, padding: space.xl }}>
            <Banner tone="danger" message={errorMessage(msgs.error)} />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(m) => m.clientId ?? m._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.3}
            onEndReached={() => msgs.hasNextPage && !msgs.isFetchingNextPage && msgs.fetchNextPage()}
            ListHeaderComponent={
              typing ? (
                <Animated.View entering={enter.fade()} exiting={exit.fade()} style={{ marginTop: space.md }}>
                  <TypingDots />
                </Animated.View>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="body" tone="secondary" center>
                  {c?.job ? `Say hello to ${c.other?.firstName ?? 'them'} about “${c.job.title}”.` : 'Say hello!'}
                </Text>
                <Text variant="caption" tone="tertiary" center>
                  For your safety, keep conversations and payments on Handzi.
                </Text>
              </View>
            }
          />
        )}
        {c?.blocked ? (
          <View style={[styles.blocked, { paddingBottom: insets.bottom + space.md }]}>
            <Text variant="body" tone="secondary" center>
              {c.blockedByMe ? `You blocked ${c.other?.firstName}.` : 'You can no longer send messages in this conversation.'}
            </Text>
            {c.blockedByMe && <Button title="Unblock" variant="outline" size="md" onPress={toggleBlock} />}
          </View>
        ) : (
          <Composer onSend={(t, imgs) => send(t, imgs)} onTyping={() => emit('typing', { conversationId: id })} bottomInset={keyboardOpen ? 0 : insets.bottom} />
        )}
      </KeyboardAvoidingView>

      <Sheet visible={menu} onClose={() => setMenu(false)} title={name}>
        {c?.role === 'client' && c.other && (
          <Button
            title="View profile"
            icon="person-outline"
            variant="outline"
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/handyman/[id]', params: { id: c.other!.id } });
            }}
          />
        )}
        {c?.job && (
          <Button
            title="View job"
            icon="clipboard-outline"
            variant="outline"
            onPress={() => {
              setMenu(false);
              router.push(c.role === 'client' ? { pathname: '/jobs/[id]', params: { id: c.job!._id } } : { pathname: '/work/[id]', params: { id: c.job!._id } });
            }}
          />
        )}
        <Button title={c?.blockedByMe ? 'Unblock' : 'Block'} icon="hand-left-outline" variant="outline" onPress={toggleBlock} />
        <Button title="Report" icon="flag-outline" variant="danger" onPress={report} />
      </Sheet>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <Pressable style={styles.viewer} onPress={() => setViewer(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          {viewer && <Image source={assetSource(viewer)} style={StyleSheet.absoluteFill} contentFit="contain" transition={200} />}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  list: { paddingHorizontal: space.lg, paddingVertical: space.md, flexGrow: 1 },
  day: { marginTop: space.xl, marginBottom: space.xs },
  empty: { flex: 1, justifyContent: 'center', padding: space.xxl, gap: space.sm, transform: [{ scaleY: -1 }] },
  blocked: { padding: space.lg, gap: space.sm, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
});
