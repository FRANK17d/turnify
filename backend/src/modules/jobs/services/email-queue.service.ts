import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmailService } from './email.service';

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

    constructor(private readonly emailService: EmailService) { }

    onModuleInit() {
        this.logger.log('📧 EmailQueueService initialized (direct send mode)');
    }

    // ==================== BOOKING EMAILS ====================
    async sendBookingCreated(data: BookingEmailJobData) {
        this.logger.debug(`Sending booking created email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendBookingCreated(data.email, data as any));
    }

    async sendBookingConfirmation(data: BookingEmailJobData) {
        this.logger.debug(`Sending booking confirmation email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendBookingConfirmation(data.email, data as any));
    }

    async sendBookingReminder(data: BookingEmailJobData) {
        this.logger.debug(`Sending booking reminder email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendBookingReminder(data.email, data as any));
    }

    async sendBookingCancellation(data: BookingEmailJobData) {
        this.logger.debug(`Sending booking cancellation email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendBookingCancellation(data.email, data as any));
    }

    async sendAdminNewBooking(data: AdminBookingEmailJobData) {
        this.logger.debug(`Sending admin new booking email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendNewBookingToAdmin(data.email, data));
    }

    async sendAdminCancellation(data: AdminBookingEmailJobData) {
        this.logger.debug(`Sending admin cancellation email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendCancellationToAdmin(data.email, data));
    }

    // ==================== PASSWORD EMAILS ====================
    async sendPasswordResetEmail(data: PasswordResetEmailJobData) {
        this.logger.debug(`Sending password reset email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendPasswordReset(data.email, data));
    }

    async sendPasswordChangedEmail(data: PasswordChangedEmailJobData) {
        this.logger.debug(`Sending password changed email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendPasswordChanged(data.email, data));
    }

    // ==================== SUBSCRIPTION EMAILS ====================
    async sendSubscriptionCreatedEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Sending subscription created email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendSubscriptionCreated(data.email, data as any));
    }

    async sendSubscriptionExpiringEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Sending subscription expiring email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendSubscriptionExpiring(data.email, data as any));
    }

    async sendSubscriptionExpiredEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Sending subscription expired email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendSubscriptionExpired(data.email, data as any));
    }

    async sendSubscriptionCancelledEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Sending subscription cancelled email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendSubscriptionCancelled(data.email, data as any));
    }

    async sendPaymentFailedEmail(data: SubscriptionEmailJobData) {
        this.logger.debug(`Sending payment failed email to ${data.email}`);
        this.sendAsync(() => this.emailService.sendPaymentFailed(data.email, data as any));
    }

    // Helper para enviar emails de forma asíncrona sin bloquear
    private sendAsync(sendFn: () => Promise<boolean>): void {
        setImmediate(async () => {
            try {
                await sendFn();
            } catch (error) {
                this.logger.error(`Error sending email: ${error.message}`);
            }
        });
    }
}
