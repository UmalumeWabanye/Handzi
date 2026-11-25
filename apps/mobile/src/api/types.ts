import type { BookingStatus, ChecklistItem, EmploymentType, JobStatus, JobUrgency, Mode, NotificationType, PaymentStatus, QuoteStatus, Role, UserStatus, VerificationStatus } from '@handyconnect/shared';

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  address?: string;
  suburb?: string;
  city?: string;
  province?: string;
};

export type Place = { suburb?: string; city?: string; province?: string };

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  phoneVerified: boolean;
  roles: Role[];
  activeMode: Mode;
  avatar?: string;
  location?: GeoPoint;
  interests?: string[];
  onboarded: { client: boolean; handyman: boolean };
  status: UserStatus;
  createdAt: string;
};

export type Category = { _id: string; slug: string; name: string; icon: string; subcategories: string[] };
export type CategoryRef = Pick<Category, '_id' | 'name' | 'slug' | 'icon'>;

export type WorkHistoryItem = {
  _id: string;
  title: string;
  company?: string;
  employmentType: EmploymentType;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
};

export type Project = {
  _id: string;
  title: string;
  description?: string;
  category?: string | CategoryRef;
  photos: string[];
  completedOn?: string;
  location?: string;
  createdAt: string;
};

export type Certification = {
  _id: string;
  name: string;
  issuer?: string;
  number?: string;
  documentUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  verified: boolean;
};

export type Stats = { averageRating: number; reviewCount: number; jobsCompleted: number; responseTimeMins?: number };

export type HandymanProfile = {
  _id: string;
  user: string;
  headline?: string;
  bio?: string;
  trades: CategoryRef[];
  skills: string[];
  languages: string[];
  yearsExperience: number;
  hourlyRate?: number;
  callOutFee?: number;
  serviceArea?: GeoPoint;
  serviceRadiusKm: number;
  workHistory: WorkHistoryItem[];
  portfolio: Project[];
  certifications: Certification[];
  verification: { status: VerificationStatus; idDocumentUrl?: string; selfieUrl?: string; rejectionReason?: string; submittedAt?: string };
  stats: Stats;
  available: boolean;
  onboardingCompletedAt?: string;
};

export type MyProfileResponse = { profile: HandymanProfile; checklist: ChecklistItem[]; published: boolean; user?: User };

export type PublicHandyman = {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  memberSince: string;
  headline?: string;
  bio?: string;
  trades: CategoryRef[];
  skills: string[];
  languages: string[];
  yearsExperience: number;
  hourlyRate?: number;
  callOutFee?: number;
  serviceRadiusKm: number;
  place: Place | null;
  workHistory: WorkHistoryItem[];
  portfolio: Project[];
  certifications: Omit<Certification, 'number' | 'documentUrl'>[];
  stats: Stats;
  verified: boolean;
  available: boolean;
  published: boolean;
};

export type HandymanCard = {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  headline?: string;
  trades: CategoryRef[];
  hourlyRate?: number;
  yearsExperience: number;
  stats: Stats;
  verified: boolean;
  place: Place | null;
  coverPhoto?: string;
  projectCount: number;
  distanceKm?: number;
};

export type AuthResponse = { user: User; accessToken: string; refreshToken: string; devCode?: string };

// ---- Jobs & quotes ----

export type Budget = { min?: number | null; max?: number | null };

export type Quote = {
  _id: string;
  job: string;
  handyman: string;
  amount: number;
  message?: string;
  estimatedDuration?: string;
  availableFrom?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
};

/** A job as returned by the API. Owners get `location`; handymen get `place`, `distanceKm` and `myQuote`. */
export type Job = {
  _id: string;
  title: string;
  description: string;
  category: CategoryRef;
  subcategory?: string;
  photos: string[];
  budget?: Budget;
  urgency: JobUrgency;
  preferredDate?: string;
  status: JobStatus;
  quoteCount: number;
  createdAt: string;
  isOwner: boolean;
  location?: GeoPoint;
  place?: Place | null;
  address?: string;
  distanceKm?: number;
  client?: { id: string; firstName: string; avatar?: string; memberSince: string };
  myQuote?: Quote | null;
  bookingId?: string;
};

export type QuoteWithHandyman = Omit<Quote, 'job' | 'handyman'> & { handyman: HandymanCard };

export type MyQuote = Omit<Quote, 'job'> & {
  job: { _id: string; title: string; status: JobStatus; category?: CategoryRef; photos: string[]; location?: Place; createdAt: string };
};

// ---- Notifications & chat ----

export type NotificationData = { jobId?: string; quoteId?: string; conversationId?: string; bookingId?: string; mode?: Mode };

export type AppNotification = {
  _id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data: NotificationData;
  read: boolean;
  createdAt: string;
};

export type ConversationSummary = {
  _id: string;
  other: { id: string; firstName: string; lastName: string; avatar?: string } | null;
  role: Mode; // my role in this conversation
  job: { _id: string; title: string; status: JobStatus } | null;
  lastMessage?: { text: string; sender: string; at: string; hasImages?: boolean };
  unread: number;
  blocked: boolean;
  blockedByMe: boolean;
  updatedAt: string;
};

export type ChatMessage = {
  _id: string;
  conversation: string;
  sender: string;
  text?: string;
  images: string[];
  readBy: string[];
  containsContact: boolean;
  clientId?: string;
  createdAt: string;
  // local-only state for optimistic sends
  pending?: boolean;
  failed?: boolean;
};

export type MessagesPage = { messages: ChatMessage[]; hasMore: boolean };

// ---- Bookings, payments & reviews ----

type Party = { id: string; firstName: string; lastName: string; avatar?: string };

export type BookingSummary = {
  _id: string;
  role: Mode; // my role in this booking
  status: BookingStatus;
  title: string;
  category?: CategoryRef;
  amount: number;
  handymanPayout: number;
  scheduledFor?: string;
  place: Place | null;
  other: Party;
  updatedAt: string;
};

export type BookingDetail = {
  _id: string;
  role: Mode;
  status: BookingStatus;
  title: string;
  job: { _id: string; title: string; category?: CategoryRef; photos: string[] } | null;
  other: Party & { memberSince: string };
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  handymanPayout: number;
  scheduledFor?: string;
  address?: string;
  place: Place | null;
  timeline: { createdAt: string; paidAt?: string; startedAt?: string; completedAt?: string; confirmedAt?: string; cancelledAt?: string; autoConfirmAt?: string };
  cancelReason?: string;
  payment: { status: PaymentStatus; reference?: string; refundAmount?: number } | null;
  dispute: { status: string; reason: string; createdAt: string } | null;
  myReview: { rating: number; text?: string } | null;
  theirReview: { rating: number; text?: string } | null;
  canReview: boolean;
  provider: string;
};

export type Earnings = {
  totals: { held: number; released: number; disputed: number; jobs: number };
  payments: {
    _id: string;
    bookingId: string;
    title?: string;
    amount: number;
    commissionAmount: number;
    payoutAmount: number;
    status: PaymentStatus;
    heldAt?: string;
    releasedAt?: string;
    refundedAt?: string;
  }[];
  provider: string;
};

export type PublicReview = {
  _id: string;
  rating: number;
  text?: string;
  createdAt: string;
  reviewer: { firstName: string; avatar?: string } | null;
  jobTitle?: string;
};
