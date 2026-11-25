import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Mode } from '@handyconnect/shared';
import { bookingApi, BookingAction, categoryApi, chatApi, handymanApi, jobApi, notificationApi, JobInput, ListItemInput, ListName, ProfileInput, quoteApi, QuoteInput, settingsApi } from './endpoints';
import type { MyProfileResponse } from './types';

export const keys = {
  categories: ['categories'] as const,
  myProfile: ['handyman', 'me'] as const,
  handyman: (id: string) => ['handyman', id] as const,
  handymen: (params: object) => ['handymen', params] as const,
  myJobs: ['jobs', 'mine'] as const,
  job: (id: string) => ['jobs', 'detail', id] as const,
  jobQuotes: (id: string) => ['jobs', 'quotes', id] as const,
  feed: (scope: string) => ['jobs', 'feed', scope] as const,
  myQuotes: ['quotes', 'mine'] as const,
  settings: ['settings'] as const,
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'count'] as const,
  conversations: (role: Mode) => ['chat', 'list', role] as const,
  chatUnread: (role: Mode) => ['chat', 'unread', role] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  bookings: (role: Mode) => ['bookings', 'list', role] as const,
  booking: (id: string) => ['bookings', 'detail', id] as const,
  earnings: ['bookings', 'earnings'] as const,
  reviews: (userId: string) => ['handyman', userId, 'reviews'] as const,
};

export const useCategories = () => useQuery({ queryKey: keys.categories, queryFn: categoryApi.list, staleTime: 60 * 60 * 1000 });

export const useMyProfile = (enabled = true) => useQuery({ queryKey: keys.myProfile, queryFn: handymanApi.mine, enabled });

/** All profile mutations return the full profile; write it straight into the cache. */
function useProfileMutation<V>(fn: (v: V) => Promise<MyProfileResponse>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(keys.myProfile, data);
      qc.invalidateQueries({ queryKey: ['handymen'] });
    },
  });
}

export const useUpdateProfile = () => useProfileMutation((input: ProfileInput) => handymanApi.update(input));

export const useSaveListItem = <L extends ListName>(list: L) =>
  useProfileMutation(({ id, input }: { id?: string; input: Partial<ListItemInput[L]> }) =>
    id ? handymanApi.updateItem(list, id, input) : handymanApi.addItem(list, input)
  );

export const useRemoveListItem = (list: ListName) => useProfileMutation((id: string) => handymanApi.removeItem(list, id));

export const useSubmitVerification = () =>
  useProfileMutation(({ idDocumentUrl, selfieUrl }: { idDocumentUrl: string; selfieUrl: string }) =>
    handymanApi.submitVerification(idDocumentUrl, selfieUrl)
  );

export const useHandymen = (params: { category?: string; lat?: number; lng?: number }) =>
  useQuery({ queryKey: keys.handymen(params), queryFn: () => handymanApi.list(params) });

export const usePublicHandyman = (id: string) => useQuery({ queryKey: keys.handyman(id), queryFn: () => handymanApi.get(id), enabled: !!id });

// ---- Jobs & quotes ----

export const usePublicSettings = () => useQuery({ queryKey: keys.settings, queryFn: settingsApi.public, staleTime: 60 * 60 * 1000 });
export const useMyJobs = () => useQuery({ queryKey: keys.myJobs, queryFn: jobApi.mine });
export const useJob = (id: string) => useQuery({ queryKey: keys.job(id), queryFn: () => jobApi.get(id), enabled: !!id });
export const useJobQuotes = (id: string, enabled = true) => useQuery({ queryKey: keys.jobQuotes(id), queryFn: () => jobApi.quotes(id), enabled: !!id && enabled });
export const useJobFeed = (scope: 'mine' | 'all') => useQuery({ queryKey: keys.feed(scope), queryFn: () => jobApi.feed({ scope }) });
export const useMyQuotes = () => useQuery({ queryKey: keys.myQuotes, queryFn: quoteApi.mine });

/** Anything that changes a job or its quotes refreshes every jobs/quotes view. */
function useJobsMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export const useCreateJob = () => useJobsMutation((input: JobInput) => jobApi.create(input));
export const useCancelJob = () => useJobsMutation((id: string) => jobApi.cancel(id));
export const useAcceptQuote = () => useJobsMutation((id: string) => quoteApi.accept(id));
export const useDeclineQuote = () => useJobsMutation((id: string) => quoteApi.decline(id));
export const useWithdrawQuote = () => useJobsMutation((id: string) => quoteApi.withdraw(id));
export const useSaveQuote = () =>
  useJobsMutation(({ jobId, quoteId, input }: { jobId: string; quoteId?: string; input: QuoteInput }) =>
    quoteId ? quoteApi.update(quoteId, input) : quoteApi.send(jobId, input)
  );

// ---- Notifications & chat ----

export const useNotifications = () => useQuery({ queryKey: keys.notifications, queryFn: notificationApi.list });
export const useNotificationCount = () => useQuery({ queryKey: keys.notificationCount, queryFn: notificationApi.unreadCount });
export const useConversations = (role: Mode) => useQuery({ queryKey: keys.conversations(role), queryFn: () => chatApi.list(role) });
export const useChatUnread = (role: Mode) => useQuery({ queryKey: keys.chatUnread(role), queryFn: () => chatApi.unreadCount(role) });
export const useConversation = (id: string) => useQuery({ queryKey: keys.conversation(id), queryFn: () => chatApi.get(id), enabled: !!id });

export const useMessages = (id: string) =>
  useInfiniteQuery({
    queryKey: keys.messages(id),
    queryFn: ({ pageParam }) => chatApi.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.messages[last.messages.length - 1]?.createdAt : undefined),
    enabled: !!id,
  });

// ---- Bookings ----

export const useBookings = (role: Mode) => useQuery({ queryKey: keys.bookings(role), queryFn: () => bookingApi.list(role) });
export const useBooking = (id: string) => useQuery({ queryKey: keys.booking(id), queryFn: () => bookingApi.get(id), enabled: !!id });
export const useEarnings = () => useQuery({ queryKey: keys.earnings, queryFn: bookingApi.earnings });
export const useHandymanReviews = (userId: string) => useQuery({ queryKey: keys.reviews(userId), queryFn: () => handymanApi.reviews(userId), enabled: !!userId });

/** Every booking action returns the updated booking; write it to the cache and refresh related lists. */
function useBookingMutation<V>(fn: (v: V) => Promise<import('./types').BookingDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (b) => {
      qc.setQueryData(keys.booking(b._id), b);
      qc.invalidateQueries({ queryKey: ['bookings', 'list'] });
      qc.invalidateQueries({ queryKey: keys.earnings });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['handyman'] });
    },
  });
}

export const usePayBooking = () => useBookingMutation(({ id, simulate }: { id: string; simulate?: 'success' | 'decline' }) => bookingApi.pay(id, simulate));
export const useBookingAction = () => useBookingMutation(({ id, action }: { id: string; action: BookingAction }) => bookingApi.act(id, action));
export const useCancelBooking = () => useBookingMutation(({ id, reason }: { id: string; reason?: string }) => bookingApi.cancel(id, reason));
export const useDisputeBooking = () => useBookingMutation(({ id, reason }: { id: string; reason: string }) => bookingApi.dispute(id, reason));
export const useReviewBooking = () => useBookingMutation(({ id, rating, text }: { id: string; rating: number; text?: string }) => bookingApi.review(id, rating, text));
