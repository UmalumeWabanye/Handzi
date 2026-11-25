export type Person = { _id: string; firstName: string; lastName: string; email?: string; phone?: string; avatar?: string };

export type Stats = {
  totals: {
    clients: number;
    handymen: number;
    publishedHandymen: number;
    pendingVerifications: number;
    openJobs: number;
    totalJobs: number;
    quotes: number;
    activeBookings: number;
    completedBookings: number;
    openDisputes: number;
    openReports: number;
    gmv: number;
    held: number;
    commission: number;
  };
  series: { signups: Point[]; jobs: Point[]; gmv: Point[] };
};
export type Point = { date: string; value: number };

export type Queues = { verifications: number; disputes: number; reports: number };

export type Verification = {
  userId: string;
  user: Person & { createdAt: string; status: string };
  headline?: string;
  trades: { _id: string; name: string }[];
  yearsExperience: number;
  place: { suburb?: string; city?: string } | null;
  verification: { status: string; idDocumentUrl?: string; selfieUrl?: string; submittedAt?: string; reviewedAt?: string; rejectionReason?: string };
  certifications: { _id: string; name: string; issuer?: string; number?: string; documentUrl?: string; verified: boolean }[];
  published: boolean;
};

export type UserRow = Person & { roles: string[]; status: string; activeMode: string; createdAt: string; lastLoginAt?: string; phoneVerified: boolean };

export type Paged<K extends string, T> = { [key in K]: T[] } & { total: number; page: number; pages: number };

export type JobRow = {
  _id: string;
  title: string;
  description: string;
  status: string;
  removedByAdmin?: boolean;
  removalReason?: string;
  quoteCount: number;
  createdAt: string;
  client: Person;
  category: { name: string };
  photos: string[];
};

export type BookingRow = {
  _id: string;
  title: string;
  status: string;
  amount: number;
  commissionAmount: number;
  handymanPayout: number;
  client: Person;
  handyman: Person;
  updatedAt: string;
  createdAt: string;
  paymentStatus: string;
};

export type PaymentDoc = {
  status: string;
  amount: number;
  commissionAmount: number;
  payoutAmount: number;
  refundAmount?: number;
  paystackReference?: string;
  history: { status: string; at: string; note?: string }[];
};

export type DisputeDoc = {
  _id: string;
  status: string;
  reason: string;
  evidence: string[];
  createdAt: string;
  openedBy: Person | string;
  adminNotes: { by: Person; text: string; at: string }[];
  resolution?: { outcome: string; refundAmount?: number; note?: string; resolvedAt?: string };
  booking: BookingRow | string;
};

export type BookingBundle = {
  booking: BookingRow & { job: { _id: string; title: string; description: string; photos: string[] }; location?: { address?: string; suburb?: string; city?: string } };
  payment: PaymentDoc | null;
  dispute: DisputeDoc | null;
  messages: { _id: string; sender: string; text?: string; images: string[]; createdAt: string; hidden: boolean; containsContact: boolean }[];
};

export type ReportRow = {
  _id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  note?: string;
  createdAt: string;
  reporter: Person;
  handledBy?: { firstName: string };
  target: { label: string; status?: string; link?: string; author?: string; authorId?: string } | null;
};

export type Category = { _id: string; slug: string; name: string; icon: string; subcategories: string[]; active: boolean; sortOrder: number };
export type Settings = { commissionPercent: number; autoConfirmHours: number };
export type AuditEntry = { _id: string; action: string; targetType?: string; targetId?: string; meta: Record<string, unknown>; createdAt: string; actor: Person | null; ip?: string };
