import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { PG_BOSS } from '../pgboss.module';
import { EmailService } from './email.service';

// Job names
export const EMAIL_JOBS = {
    SEND_BOOKING_CREATED: 'email-booking-created',
    SEND_BOOKING_CONFIRMATION: 'email-booking-confirmation',
    SEND_BOOKING_REMINDER: 'email-booking-reminder',
    SEND_BOOKING_CANCELLATION: 'email-booking-cancellation',
    SEND_ADMIN_NEW_BOOKING: 'email-admin-new-booking',
    SEND_ADMIN_CANCELLATION: 'email-admin-cancellation',
    SEND_PASSWORD_RESET: 'email-password-reset',
    SEND_PASSWORD_CHANGED: 'email-password-changed',
    SEND_SUBSCRIPTION_CREATED: 'email-subscription-created',
    SEND_SUBSCRIPTION_EXPIRING: 'email-subscription-expiring',
    SEND_SUBSCRIPTION_EXPIRED: 'email-subscription-expired',
    SEND_SUBSCRIPTION_CANCELLED: 'email-subscription-cancelled',
    SEND_PAYMENT_FAILED: 'email-payment-failed',
};

export interface BookingEmailJobData {
    email: string;
    userName: string;
    serviceName: string;
    date: string;
    time: string;
    duration?: number;
    tenantName: string;
    bookingId?: string;
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
    amount?: number;
    expirationDate?: string;
    daysRemaining?: number;
}

@Injectable()
export class EmailQueueService implements OnModuleInit {
    private readonly logger = new Logger(EmailQueueService.name);

    constructor(
        @Inject(PG_BOSS) private readonly boss: any,
        private readonly emailService: EmailService,
    ) { }

    async onModuleInit() {
        this.logger.log('📧 Registering email job handlers...');

        // Registrar handlers para cada tipo de email
        await this.registerHandlers();

        this.logger.log('✅ Email job handlers registered');
    }

    private async registerHandlers() {
        // Booking emails
        await this.boss.work(EMAIL_JOBS.SEND_BOOKING_CREATED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendBookingCreated(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_BOOKING_CONFIRMATION, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendBookingConfirmation(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_BOOKING_REMINDER, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendBookingReminder(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_BOOKING_CANCELLATION, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendBookingCancellation(job.data.email, job.data);
        });

        // Admin emails
        await this.boss.work(EMAIL_JOBS.SEND_ADMIN_NEW_BOOKING, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendNewBookingToAdmin(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_ADMIN_CANCELLATION, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendCancellationToAdmin(job.data.email, job.data);
        });

        // Password emails
        await this.boss.work(EMAIL_JOBS.SEND_PASSWORD_RESET, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendPasswordReset(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_PASSWORD_CHANGED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendPasswordChanged(job.data.email, job.data);
        });

        // Subscription emails
        await this.boss.work(EMAIL_JOBS.SEND_SUBSCRIPTION_CREATED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendSubscriptionCreated(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_SUBSCRIPTION_EXPIRING, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendSubscriptionExpiring(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_SUBSCRIPTION_EXPIRED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendSubscriptionExpired(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_SUBSCRIPTION_CANCELLED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendSubscriptionCancelled(job.data.email, job.data);
        });

        await this.boss.work(EMAIL_JOBS.SEND_PAYMENT_FAILED, async (job) => {
            this.logger.log(`🔄 Processing ${job.name} for ${job.data.email}`);
            await this.emailService.sendPaymentFailed(job.data.email, job.data);
        });
    }

    // ==================== QUEUE METHODS ====================

    async sendBookingCreated(data: BookingEmailJobData) {
        this.logger.debug(`Queueing booking created email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_BOOKING_CREATED, data);
    }

    async sendBookingConfirmation(data: BookingEmailJobData) {
        this.logger.debug(`Queueing booking confirmation email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_BOOKING_CONFIRMATION, data);
    }

    async sendBookingReminder(data: BookingEmailJobData) {
        this.logger.debug(`Queueing booking reminder email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_BOOKING_REMINDER, data);
    }

    async sendBookingCancellation(data: BookingEmailJobData) {
        this.logger.debug(`Queueing booking cancellation email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_BOOKING_CANCELLATION, data);
    }

    async sendAdminNewBooking(data: AdminBookingEmailJobData) {
        this.logger.debug(`Queueing admin new booking email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_ADMIN_NEW_BOOKING, data);
    }

    async sendAdminCancellation(data: AdminBookingEmailJobData) {
        this.logger.debug(`Queueing admin cancellation email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_ADMIN_CANCELLATION, data);
    }

    async sendPasswordResetEmail(data: PasswordResetEmailJobData) {
        this.logger.debug(`Queueing password reset email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_PASSWORD_RESET, data);
    }

    async sendPasswordChangedEmail(data: PasswordChangedEmailJobData) {
        this.logger.debug(`Queueing password changed email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_PASSWORD_CHANGED, data);
    }

    async sendSubscriptionCreatedEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Queueing subscription created email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_SUBSCRIPTION_CREATED, data);
    }

    async sendSubscriptionExpiringEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Queueing subscription expiring email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_SUBSCRIPTION_EXPIRING, data);
    }

    async sendSubscriptionExpiredEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Queueing subscription expired email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_SUBSCRIPTION_EXPIRED, data);
    }

    async sendSubscriptionCancelledEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Queueing subscription cancelled email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_SUBSCRIPTION_CANCELLED, data);
    }

    async sendPaymentFailedEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Queueing payment failed email to ${data.email}`);
        return this.boss.send(EMAIL_JOBS.SEND_PAYMENT_FAILED, data);
    }
}
