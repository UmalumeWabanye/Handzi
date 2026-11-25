import type { Ionicons } from '@expo/vector-icons';
import type { BookingStatus, JobStatus, JobUrgency, PaymentStatus, QuoteStatus } from '@handyconnect/shared';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
type Icon = keyof typeof Ionicons.glyphMap;

export const URGENCY: Record<JobUrgency, { label: string; hint: string; icon: Icon; tone: Tone }> = {
  urgent: { label: 'Urgent', hint: 'As soon as possible', icon: 'flash', tone: 'danger' },
  this_week: { label: 'This week', hint: 'Within the next few days', icon: 'calendar', tone: 'warning' },
  flexible: { label: 'Flexible', hint: "I'm not in a rush", icon: 'time', tone: 'neutral' },
};

export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: Tone }> = {
  open: { label: 'Taking quotes', tone: 'accent' },
  assigned: { label: 'Hired', tone: 'success' },
  in_progress: { label: 'In progress', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  disputed: { label: 'Disputed', tone: 'danger' },
};

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: Tone; icon: Icon }> = {
  pending: { label: 'Waiting for client', tone: 'warning', icon: 'time-outline' },
  accepted: { label: 'Hired', tone: 'success', icon: 'checkmark-circle' },
  rejected: { label: 'Not selected', tone: 'neutral', icon: 'close-circle-outline' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: 'arrow-undo-outline' },
};

export const ACTIVE_JOB_STATUSES: JobStatus[] = ['open', 'assigned', 'in_progress', 'disputed'];

/** Booking status copy, per side. `title` is the headline on the booking page. */
export const BOOKING_META: Record<BookingStatus, { label: string; tone: Tone; icon: Icon; client: string; handyman: string }> = {
  awaiting_payment: { label: 'Awaiting payment', tone: 'warning', icon: 'card-outline', client: 'Pay to confirm your booking', handyman: 'Waiting for the client to pay' },
  funded: { label: 'Paid · ready to start', tone: 'accent', icon: 'lock-closed', client: 'Payment held safely', handyman: "You're booked. Payment is secured." },
  in_progress: { label: 'In progress', tone: 'accent', icon: 'hammer', client: 'Work is underway', handyman: 'Job in progress' },
  completed: { label: 'Waiting for confirmation', tone: 'warning', icon: 'hourglass', client: 'Check the work and confirm', handyman: 'Waiting for the client to confirm' },
  confirmed: { label: 'Completed', tone: 'success', icon: 'checkmark-circle', client: 'Job done!', handyman: 'Job done. Payment released.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'close-circle', client: 'Booking cancelled', handyman: 'Booking cancelled' },
  disputed: { label: 'Under review', tone: 'danger', icon: 'alert-circle', client: "We're looking into it", handyman: 'Payment on hold while we review' },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone; icon: Icon }> = {
  pending: { label: 'Not paid', tone: 'neutral', icon: 'card-outline' },
  held: { label: 'Held safely by Handzi', tone: 'accent', icon: 'lock-closed' },
  released: { label: 'Released to handyman', tone: 'success', icon: 'checkmark-circle' },
  refunded: { label: 'Refunded to client', tone: 'neutral', icon: 'arrow-undo' },
  disputed: { label: 'On hold (under review)', tone: 'danger', icon: 'alert-circle' },
  failed: { label: 'Payment failed', tone: 'danger', icon: 'close-circle' },
};

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['awaiting_payment', 'funded', 'in_progress', 'completed', 'disputed'];
