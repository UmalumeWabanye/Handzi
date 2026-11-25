import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import type { Mode } from '@handyconnect/shared';
import { errorMessage } from '@/api/client';
import { useConversations } from '@/api/hooks';
import type { ConversationSummary } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { TabPage } from '@/features/shared/TabPage';
import { timeAgo } from '@/lib/format';
import { Avatar, Banner, Card, CardSkeleton, EmptyState, Text, enter, radius, space, useAccent } from '@/ui';

function Row({ c, index, me }: { c: ConversationSummary; index: number; me?: string }) {
  const accent = useAccent();
  const name = c.other ? `${c.other.firstName} ${c.other.lastName}` : 'Unknown';
  const unread = c.unread > 0;
  const preview = c.lastMessage ? `${c.lastMessage.sender === me ? 'You: ' : ''}${c.lastMessage.text}` : '';
  return (
    <Animated.View entering={enter.stagger(index)}>
      <Card onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c._id } })} style={styles.row} accessibilityLabel={`${name}${unread ? `, ${c.unread} unread` : ''}. ${preview}`}>
        <Avatar uri={c.other?.avatar} name={name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.top}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Text>
            {c.lastMessage && (
              <Text variant="caption" tone={unread ? 'primary' : 'tertiary'} color={unread ? accent.main : undefined}>
                {timeAgo(c.lastMessage.at)}
              </Text>
            )}
          </View>
          {c.job && (
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              Re: {c.job.title}
            </Text>
          )}
          <View style={styles.top}>
            <Text variant={unread ? 'bodyStrong' : 'body'} tone={unread ? 'primary' : 'secondary'} numberOfLines={1} style={{ flex: 1 }}>
              {c.blocked ? 'Conversation blocked' : preview}
            </Text>
            {unread && (
              <View style={[styles.count, { backgroundColor: accent.main }]}>
                <Text variant="caption" color="#fff" style={{ fontWeight: '700' }}>
                  {c.unread > 99 ? '99+' : c.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

/** Inbox for one side of the app (client or handyman conversations). */
export function ConversationList({ role }: { role: Mode }) {
  const { user } = useAuth();
  const q = useConversations(role);
  return (
    <TabPage title="Messages" refreshing={q.isRefetching} onRefresh={q.refetch}>
      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : q.error ? (
        <Banner tone="danger" message={errorMessage(q.error)} />
      ) : q.data?.length ? (
        <View style={{ gap: space.sm }}>
          {q.data.map((c, i) => (
            <Row key={c._id} c={c} index={i} me={user?.id} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          text={role === 'client' ? 'Message a handyman from any quote on your job.' : 'Ask a client a question from any job page before you quote.'}
        />
      )}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  count: { minWidth: 22, height: 22, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
