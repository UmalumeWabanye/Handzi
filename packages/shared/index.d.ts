type ValueOf<T> = T[keyof T];

export declare const ROLES: { readonly CLIENT: 'client'; readonly HANDYMAN: 'handyman'; readonly ADMIN: 'admin' };
export declare const MODES: { readonly CLIENT: 'client'; readonly HANDYMAN: 'handyman' };
export declare const USER_STATUS: { readonly ACTIVE: 'active'; readonly SUSPENDED: 'suspended'; readonly BANNED: 'banned' };
export declare const VERIFICATION_STATUS: { readonly NONE: 'none'; readonly PENDING: 'pending'; readonly VERIFIED: 'verified'; readonly REJECTED: 'rejected' };
export declare const JOB_STATUS: {
  readonly OPEN: 'open'; readonly ASSIGNED: 'assigned'; readonly IN_PROGRESS: 'in_progress'; readonly COMPLETED: 'completed';
  readonly CLOSED: 'closed'; readonly CANCELLED: 'cancelled'; readonly DISPUTED: 'disputed';
};
export declare const JOB_URGENCY: { readonly FLEXIBLE: 'flexible'; readonly THIS_WEEK: 'this_week'; readonly URGENT: 'urgent' };
export declare const QUOTE_STATUS: { readonly PENDING: 'pending'; readonly ACCEPTED: 'accepted'; readonly REJECTED: 'rejected'; readonly WITHDRAWN: 'withdrawn' };
export declare const BOOKING_STATUS: {
  readonly AWAITING_PAYMENT: 'awaiting_payment'; readonly FUNDED: 'funded'; readonly IN_PROGRESS: 'in_progress'; readonly COMPLETED: 'completed';
  readonly CONFIRMED: 'confirmed'; readonly CANCELLED: 'cancelled'; readonly DISPUTED: 'disputed';
};
export declare const PAYMENT_STATUS: {
  readonly PENDING: 'pending'; readonly HELD: 'held'; readonly RELEASED: 'released'; readonly REFUNDED: 'refunded';
  readonly DISPUTED: 'disputed'; readonly FAILED: 'failed';
};
export declare const PRICING_TYPE: { readonly FIXED: 'fixed'; readonly HOURLY: 'hourly'; readonly QUOTE: 'quote' };
export declare const DISPUTE_STATUS: { readonly OPEN: 'open'; readonly UNDER_REVIEW: 'under_review'; readonly RESOLVED: 'resolved' };
export declare const DISPUTE_RESOLUTION: { readonly RELEASE: 'release'; readonly REFUND: 'refund'; readonly SPLIT: 'split' };
export declare const REPORT_TARGET: { readonly USER: 'user'; readonly LISTING: 'listing'; readonly JOB: 'job'; readonly MESSAGE: 'message'; readonly REVIEW: 'review' };
export declare const REPORT_STATUS: { readonly OPEN: 'open'; readonly ACTIONED: 'actioned'; readonly DISMISSED: 'dismissed' };

export interface CategorySeed { slug: string; name: string; icon: string; subcategories: string[] }
export declare const DEFAULT_CATEGORIES: readonly CategorySeed[];
export declare const EMPLOYMENT_TYPES: {
  readonly SELF_EMPLOYED: 'self_employed'; readonly EMPLOYED: 'employed'; readonly CONTRACT: 'contract'; readonly APPRENTICESHIP: 'apprenticeship';
};
export declare const UPLOAD_KINDS: {
  readonly AVATAR: 'avatar'; readonly PORTFOLIO: 'portfolio'; readonly CERTIFICATE: 'certificate'; readonly ID_DOCUMENT: 'id_document'; readonly SELFIE: 'selfie'; readonly JOB: 'job'; readonly MESSAGE: 'message';
};
export declare const PRIVATE_UPLOAD_KINDS: readonly UploadKind[];
export declare const PROFILE_BIO_MIN: number;
export declare const PORTFOLIO_MAX_PHOTOS: number;
export declare const JOB_DESCRIPTION_MIN: number;
export declare const JOB_MAX_PHOTOS: number;
export declare const QUOTE_MESSAGE_MIN: number;
export declare const QUOTE_DURATIONS: readonly string[];

export type ChecklistKey = 'basics' | 'trades' | 'experience' | 'portfolio' | 'certifications' | 'area' | 'verification';
export interface ChecklistItem { key: ChecklistKey; label: string; required: boolean; done: boolean }
export declare function handymanChecklist(profile: unknown, user: unknown): ChecklistItem[];

export declare const NOTIFICATION_TYPES: {
  readonly JOB_NEARBY: 'job_nearby'; readonly QUOTE_RECEIVED: 'quote_received'; readonly QUOTE_UPDATED: 'quote_updated';
  readonly QUOTE_ACCEPTED: 'quote_accepted'; readonly QUOTE_REJECTED: 'quote_rejected'; readonly JOB_CANCELLED: 'job_cancelled'; readonly MESSAGE: 'message';
  readonly BOOKING_PAID: 'booking_paid'; readonly JOB_STARTED: 'job_started'; readonly JOB_COMPLETED: 'job_completed'; readonly PAYMENT_RELEASED: 'payment_released';
  readonly BOOKING_CANCELLED: 'booking_cancelled'; readonly DISPUTE_OPENED: 'dispute_opened'; readonly REVIEW_RECEIVED: 'review_received';
  readonly VERIFICATION_APPROVED: 'verification_approved'; readonly VERIFICATION_REJECTED: 'verification_rejected'; readonly DISPUTE_RESOLVED: 'dispute_resolved'; readonly SERVICE_BOOKED: 'service_booked';
};
export type NotificationType = ValueOf<typeof NOTIFICATION_TYPES>;
export declare const MESSAGE_MAX_IMAGES: number;
export declare const REVIEW_DIRECTION: { readonly CLIENT_TO_HANDYMAN: 'client_to_handyman'; readonly HANDYMAN_TO_CLIENT: 'handyman_to_client' };
export declare const SERVICE_MAX_TIERS: number;
export declare const SERVICE_SEARCH_RADII: readonly number[];
export declare const SERVICE_DESCRIPTION_MIN: number;
export declare const CURRENCY: 'ZAR';
export declare const DEFAULT_COMMISSION_PERCENT: number;
export declare const DEFAULT_AUTO_CONFIRM_HOURS: number;

export type Role = ValueOf<typeof ROLES>;
export type Mode = ValueOf<typeof MODES>;
export type UserStatus = ValueOf<typeof USER_STATUS>;
export type VerificationStatus = ValueOf<typeof VERIFICATION_STATUS>;
export type JobStatus = ValueOf<typeof JOB_STATUS>;
export type JobUrgency = ValueOf<typeof JOB_URGENCY>;
export type QuoteStatus = ValueOf<typeof QUOTE_STATUS>;
export type BookingStatus = ValueOf<typeof BOOKING_STATUS>;
export type PaymentStatus = ValueOf<typeof PAYMENT_STATUS>;
export type PricingType = ValueOf<typeof PRICING_TYPE>;
export type EmploymentType = ValueOf<typeof EMPLOYMENT_TYPES>;
export type UploadKind = ValueOf<typeof UPLOAD_KINDS>;
