import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  BookingEmailJobData,
  PasswordResetEmailJobData,
  PasswordChangedEmailJobData,
  SubscriptionEmailJobData,
  CreateNotificationJobData,
  AdminBookingEmailJobData,
} from '../constants/job.constants';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BOOKING)
    private bookingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SUBSCRIPTION)
    private subscriptionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private notificationQueue: Queue,
  ) { }

  // ==================== BOOKING EMAILS ====================
  async sendBookingCreated(data: BookingEmailJobData) {
    this.logger.debug(`Queueing booking created email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_BOOKING_CREATED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendBookingConfirmation(data: BookingEmailJobData) {
    this.logger.debug(`Queueing booking confirmation email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_BOOKING_CONFIRMATION, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendBookingReminder(data: BookingEmailJobData) {
    this.logger.debug(`Queueing booking reminder email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_BOOKING_REMINDER, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendBookingCancellation(data: BookingEmailJobData) {
    this.logger.debug(`Queueing booking cancellation email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_BOOKING_CANCELLATION, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendAdminNewBooking(data: AdminBookingEmailJobData) {
    this.logger.debug(`Queueing admin new booking email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_ADMIN_NEW_BOOKING, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendAdminCancellation(data: AdminBookingEmailJobData) {
    this.logger.debug(`Queueing admin cancellation email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_ADMIN_CANCELLATION, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  // ==================== PASSWORD EMAILS ====================
  async sendPasswordResetEmail(data: PasswordResetEmailJobData) {
    this.logger.debug(`Queueing password reset email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_PASSWORD_RESET, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      priority: 1, // Alta prioridad
    });
  }

  async sendPasswordChangedEmail(data: PasswordChangedEmailJobData) {
    this.logger.debug(`Queueing password changed email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_PASSWORD_CHANGED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  // ==================== SUBSCRIPTION EMAILS ====================
  async sendSubscriptionCreatedEmail(data: SubscriptionEmailJobData) {
    this.logger.debug(`Queueing subscription created email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_CREATED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendSubscriptionExpiringEmail(data: SubscriptionEmailJobData) {
    this.logger.debug(`Queueing subscription expiring email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRING, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendSubscriptionExpiredEmail(data: SubscriptionEmailJobData) {
    this.logger.debug(`Queueing subscription expired email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendSubscriptionCancelledEmail(data: SubscriptionEmailJobData) {
    this.logger.debug(`Queueing subscription cancelled email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_CANCELLED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async sendPaymentFailedEmail(data: SubscriptionEmailJobData) {
    this.logger.debug(`Queueing payment failed email to ${data.email}`);
    return this.emailQueue.add(JOB_NAMES.SEND_PAYMENT_FAILED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      priority: 1, // Alta prioridad
    });
  }

  // ==================== NOTIFICATIONS ====================
  async createNotification(data: CreateNotificationJobData) {
    this.logger.debug(`Queueing notification for user ${data.userId}`);
    return this.notificationQueue.add(JOB_NAMES.CREATE_NOTIFICATION, data);
  }

  // ==================== SCHEDULED JOBS ====================
  async triggerBookingReminders() {
    this.logger.log('Manually triggering booking reminders job');
    return this.bookingQueue.add(JOB_NAMES.PROCESS_BOOKING_REMINDERS, {});
  }

  async triggerExpiringSubscriptionsCheck() {
    this.logger.log('Manually triggering expiring subscriptions check');
    return this.subscriptionQueue.add(JOB_NAMES.CHECK_EXPIRING_SUBSCRIPTIONS, {});
  }

  async triggerExpiredSubscriptionsCheck() {
    this.logger.log('Manually triggering expired subscriptions check');
    return this.subscriptionQueue.add(JOB_NAMES.CHECK_EXPIRED_SUBSCRIPTIONS, {});
  }

  // ==================== QUEUE STATUS ====================
  async getQueueStatus() {
    const [emailStats, bookingStats, subscriptionStats, notificationStats] = await Promise.all([
      this.getQueueStats(this.emailQueue),
      this.getQueueStats(this.bookingQueue),
      this.getQueueStats(this.subscriptionQueue),
      this.getQueueStats(this.notificationQueue),
    ]);

    return {
      email: emailStats,
      booking: bookingStats,
      subscription: subscriptionStats,
      notification: notificationStats,
    };
  }

  private async getQueueStats(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
