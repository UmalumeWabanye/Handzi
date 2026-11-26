import type { JobUrgency, Mode, PricingType, UploadKind } from '@handyconnect/shared';
import { api } from './client';
import type {
  AppNotification,
  AuthResponse,
  BookingDetail,
  BookingSummary,
  Earnings,
  PublicReview,
  Service,
  ServiceCard,
  ServiceDetail,
  ServiceTier,
  Category,
  ChatMessage,
  ConversationSummary,
  MessagesPage,
  Certification,
  GeoPoint,
  HandymanCard,
  HandymanProfile,
  Job,
  MyProfileResponse,
  MyQuote,
  Quote,
  QuoteWithHandyman,
  Project,
  PublicHandyman,
  User,
  WorkHistoryItem,
} from './types';

export type RegisterInput = { firstName: string; lastName: string; phone: string; email?: string; password: string; mode: Mode };

export const authApi = {
  register: (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input).then((r) => r.data),
  login: (identifier: string, password: string, mode: Mode) =>
    api.post<AuthResponse>('/auth/login', { identifier, password, mode }).then((r) => r.data),
  sendOtp: (phone: string) => api.post<{ devCode?: string }>('/auth/otp/send', { phone }).then((r) => r.data),
  verifyOtp: (phone: string, code: string) => api.post<{ user: User }>('/auth/otp/verify', { phone, code }).then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  logout: (pushToken?: string | null) => api.post('/auth/logout', pushToken ? { pushToken } : {}),
};

export const userApi = {
  update: (input: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'avatar' | 'location' | 'interests'>>) =>
    api.patch<{ user: User }>('/users/me', input).then((r) => r.data.user),
  completeClientOnboarding: (input: { location: GeoPoint; interests?: string[]; avatar?: string }) =>
    api.post<{ user: User }>('/users/me/onboarding/client', input).then((r) => r.data.user),
  switchMode: (mode: Mode) => api.post<AuthResponse>('/users/me/mode', { mode }).then((r) => r.data),
  becomeHandyman: () => api.post<AuthResponse>('/users/me/handyman', {}).then((r) => r.data),
  registerPushToken: (token: string) => api.post('/users/me/push-tokens', { token }),
};

export const categoryApi = {
  list: () => api.get<{ categories: Category[] }>('/categories').then((r) => r.data.categories),
};

export type ProfileInput = Partial<
  Pick<HandymanProfile, 'headline' | 'bio' | 'skills' | 'languages' | 'yearsExperience' | 'hourlyRate' | 'callOutFee' | 'serviceArea' | 'serviceRadiusKm' | 'available'>
> & { trades?: string[] };

export type ListName = 'work-history' | 'portfolio' | 'certifications';
export type ListItemInput = {
  'work-history': Omit<WorkHistoryItem, '_id'>;
  portfolio: Omit<Project, '_id' | 'createdAt' | 'category'> & { category?: string | null };
  certifications: Omit<Certification, '_id' | 'verified'>;
};

export const handymanApi = {
  mine: () => api.get<MyProfileResponse>('/handymen/me').then((r) => r.data),
  update: (input: ProfileInput) => api.patch<MyProfileResponse>('/handymen/me', input).then((r) => r.data),
  addItem: <L extends ListName>(list: L, input: Partial<ListItemInput[L]>) =>
    api.post<MyProfileResponse>(`/handymen/me/${list}`, input).then((r) => r.data),
  updateItem: <L extends ListName>(list: L, id: string, input: Partial<ListItemInput[L]>) =>
    api.patch<MyProfileResponse>(`/handymen/me/${list}/${id}`, input).then((r) => r.data),
  removeItem: (list: ListName, id: string) => api.delete<MyProfileResponse>(`/handymen/me/${list}/${id}`).then((r) => r.data),
  submitVerification: (idDocumentUrl: string, selfieUrl: string) =>
    api.post<MyProfileResponse>('/handymen/me/verification', { idDocumentUrl, selfieUrl }).then((r) => r.data),
  completeOnboarding: () => api.post<MyProfileResponse & { user: User }>('/handymen/me/complete-onboarding').then((r) => r.data),
  list: (params: { category?: string; lat?: number; lng?: number; verified?: boolean }) =>
    api.get<{ handymen: HandymanCard[] }>('/handymen', { params }).then((r) => r.data.handymen),
  get: (userId: string) => api.get<{ handyman: PublicHandyman }>(`/handymen/${userId}`).then((r) => r.data.handyman),
  reviews: (userId: string) => api.get<{ reviews: PublicReview[] }>(`/handymen/${userId}/reviews`).then((r) => r.data.reviews),
};

export const uploadApi = {
  upload: (file: { uri: string; name: string; type: string }, kind: UploadKind) => {
    const form = new FormData();
    form.append('kind', kind);
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('file', file as unknown as Blob);
    return api
      .post<{ url: string; private: boolean }>('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
      .then((r) => r.data);
  },
};

export type JobInput = {
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  photos: string[];
  location: GeoPoint;
  urgency: JobUrgency;
  preferredDate?: string;
  budget?: { min?: number; max?: number };
};

export type QuoteInput = { amount: number; message: string; estimatedDuration?: string; availableFrom?: string | null };

export const jobApi = {
  create: (input: JobInput) => api.post<{ job: Job }>('/jobs', input).then((r) => r.data.job),
  mine: () => api.get<{ jobs: Job[] }>('/jobs/mine').then((r) => r.data.jobs),
  feed: (params: { scope?: 'mine' | 'all' }) => api.get<{ jobs: Job[]; radiusKm: number }>('/jobs/feed', { params }).then((r) => r.data),
  get: (id: string) => api.get<{ job: Job }>(`/jobs/${id}`).then((r) => r.data.job),
  cancel: (id: string) => api.post<{ job: Job }>(`/jobs/${id}/cancel`).then((r) => r.data.job),
  quotes: (id: string) => api.get<{ quotes: QuoteWithHandyman[] }>(`/jobs/${id}/quotes`).then((r) => r.data.quotes),
};

export const quoteApi = {
  send: (jobId: string, input: QuoteInput) => api.post<{ quote: Quote }>(`/jobs/${jobId}/quotes`, input).then((r) => r.data.quote),
  update: (id: string, input: Partial<QuoteInput>) => api.patch<{ quote: Quote }>(`/quotes/${id}`, input).then((r) => r.data.quote),
  withdraw: (id: string) => api.post<{ quote: Quote }>(`/quotes/${id}/withdraw`).then((r) => r.data.quote),
  accept: (id: string) => api.post<{ quote: Quote; job: Job; booking: { _id: string } }>(`/quotes/${id}/accept`).then((r) => r.data),
  decline: (id: string) => api.post<{ quote: Quote }>(`/quotes/${id}/decline`).then((r) => r.data.quote),
  mine: () => api.get<{ quotes: MyQuote[] }>('/quotes/mine').then((r) => r.data.quotes),
};

export const settingsApi = {
  public: () => api.get<{ settings: { commissionPercent: number; autoConfirmHours: number } }>('/settings/public').then((r) => r.data.settings),
};

export const notificationApi = {
  list: () => api.get<{ notifications: AppNotification[]; unread: number }>('/notifications').then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (ids?: string[]) => api.post<{ unread: number }>('/notifications/read', ids ? { ids } : {}).then((r) => r.data.unread),
};

export const chatApi = {
  list: (role: Mode) => api.get<{ conversations: ConversationSummary[] }>('/conversations', { params: { role } }).then((r) => r.data.conversations),
  unreadCount: (role: Mode) => api.get<{ count: number }>('/conversations/unread-count', { params: { role } }).then((r) => r.data.count),
  start: (jobId: string, userId?: string) =>
    api.post<{ conversation: ConversationSummary }>('/conversations', { jobId, userId }).then((r) => r.data.conversation),
  get: (id: string) => api.get<{ conversation: ConversationSummary }>(`/conversations/${id}`).then((r) => r.data.conversation),
  messages: (id: string, before?: string) =>
    api.get<MessagesPage>(`/conversations/${id}/messages`, { params: before ? { before } : {} }).then((r) => r.data),
  send: (id: string, input: { text?: string; images?: string[]; clientId?: string }) =>
    api.post<{ message: ChatMessage }>(`/conversations/${id}/messages`, input).then((r) => r.data.message),
  markRead: (id: string) => api.post(`/conversations/${id}/read`),
  block: (id: string) => api.post<{ conversation: ConversationSummary }>(`/conversations/${id}/block`).then((r) => r.data.conversation),
  unblock: (id: string) => api.post<{ conversation: ConversationSummary }>(`/conversations/${id}/unblock`).then((r) => r.data.conversation),
};

export const reportApi = {
  create: (targetType: 'user' | 'job' | 'message' | 'listing' | 'review', targetId: string, reason: string) =>
    api.post('/reports', { targetType, targetId, reason }),
};

export type BookingAction = 'start' | 'complete' | 'confirm';

export const bookingApi = {
  list: (role: Mode) => api.get<{ bookings: BookingSummary[] }>('/bookings', { params: { role } }).then((r) => r.data.bookings),
  get: (id: string) => api.get<{ booking: BookingDetail }>(`/bookings/${id}`).then((r) => r.data.booking),
  pay: (id: string, simulate?: 'success' | 'decline') => api.post<{ booking: BookingDetail }>(`/bookings/${id}/pay`, { simulate }).then((r) => r.data.booking),
  act: (id: string, action: BookingAction) => api.post<{ booking: BookingDetail }>(`/bookings/${id}/${action}`).then((r) => r.data.booking),
  cancel: (id: string, reason?: string) => api.post<{ booking: BookingDetail }>(`/bookings/${id}/cancel`, { reason }).then((r) => r.data.booking),
  dispute: (id: string, reason: string) => api.post<{ booking: BookingDetail }>(`/bookings/${id}/dispute`, { reason }).then((r) => r.data.booking),
  review: (id: string, rating: number, text?: string) => api.post<{ booking: BookingDetail }>(`/bookings/${id}/review`, { rating, text }).then((r) => r.data.booking),
  earnings: () => api.get<Earnings>('/bookings/earnings').then((r) => r.data),
};

export type ServiceInput = {
  category: string;
  subcategory?: string | null;
  title: string;
  description: string;
  photos: string[];
  pricingType: PricingType;
  tiers: Omit<ServiceTier, '_id'>[];
  active?: boolean;
};

export type ServiceSearch = { q?: string; category?: string; lat?: number; lng?: number; radiusKm: number };

export const serviceApi = {
  mine: () => api.get<{ services: Service[]; visible: boolean }>('/services/mine').then((r) => r.data),
  create: (input: ServiceInput) => api.post<{ service: Service }>('/services', input).then((r) => r.data.service),
  update: (id: string, input: Partial<ServiceInput>) => api.patch<{ service: Service }>(`/services/${id}`, input).then((r) => r.data.service),
  remove: (id: string) => api.delete(`/services/${id}`),
  search: (params: ServiceSearch) =>
    api.get<{ services: ServiceCard[]; radiusKm: number }>('/services/search', { params }).then((r) => r.data),
  byHandyman: (userId: string) => api.get<{ services: ServiceCard[] }>(`/services/by/${userId}`).then((r) => r.data.services),
  get: (id: string) => api.get<{ service: ServiceDetail }>(`/services/${id}`).then((r) => r.data.service),
  book: (id: string, input: { tierId: string; scheduledFor?: string | null; note?: string }) =>
    api.post<{ booking: { _id: string; amount: number; title: string } }>(`/services/${id}/book`, input).then((r) => r.data.booking),
};
