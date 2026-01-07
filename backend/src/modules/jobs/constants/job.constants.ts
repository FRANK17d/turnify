// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  BOOKING: 'booking-queue',
  SUBSCRIPTION: 'subscription-queue',
  NOTIFICATION: 'notification-queue',
} as const;

// Job names
export const JOB_NAMES = {
  // Email jobs
  SEND_EMAIL: 'send-email',
  SEND_BOOKING_CREATED: 'send-booking-created',
  SEND_BOOKING_CONFIRMATION: 'send-booking-confirmation',
  SEND_BOOKING_REMINDER: 'send-booking-reminder',
  SEND_BOOKING_CANCELLATION: 'send-booking-cancellation',
  SEND_PASSWORD_RESET: 'send-password-reset',
  SEND_PASSWORD_CHANGED: 'send-password-changed',
  SEND_SUBSCRIPTION_CREATED: 'send-subscription-created',
  SEND_SUBSCRIPTION_EXPIRING: 'send-subscription-expiring',
  SEND_SUBSCRIPTION_EXPIRED: 'send-subscription-expired',
  SEND_SUBSCRIPTION_CANCELLED: 'send-subscription-cancelled',
  SEND_PAYMENT_FAILED: 'send-payment-failed',
  SEND_ADMIN_NEW_BOOKING: 'send-admin-new-booking',
  SEND_ADMIN_CANCELLATION: 'send-admin-cancellation',

  // Booking jobs
  PROCESS_BOOKING_REMINDERS: 'process-booking-reminders',

  // Subscription jobs
  CHECK_EXPIRING_SUBSCRIPTIONS: 'check-expiring-subscriptions',
  CHECK_EXPIRED_SUBSCRIPTIONS: 'check-expired-subscriptions',

  // Notification jobs
  CREATE_NOTIFICATION: 'create-notification',
} as const;

// Job data interfaces
export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BookingEmailJobData {
  email: string;
  userName: string;
  serviceName: string;
  date: string;
  time: string;
  duration?: number;
  tenantName: string;
  bookingId: string;
}

export interface PasswordResetEmailJobData {
  email: string;
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export interface PasswordChangedEmailJobData {
  email: string;
  userName: string;
}

export interface SubscriptionEmailJobData {
  email: string;
  userName: string;
  planName: string;
  tenantName: string;
  price?: number;
  expirationDate?: string;
  daysRemaining?: number;
  amount?: number;
}

export interface CreateNotificationJobData {
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface AdminBookingEmailJobData {
  email: string;
  adminName: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  tenantName: string;
}
