import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../services/email.service';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  SendEmailJobData,
  BookingEmailJobData,
  PasswordResetEmailJobData,
  PasswordChangedEmailJobData,
  AdminBookingEmailJobData,
  SubscriptionEmailJobData,
} from '../constants/job.constants';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) { }



  @Process(JOB_NAMES.SEND_EMAIL)
  async handleSendEmail(job: Job<SendEmailJobData>) {
    this.logger.debug(`Processing email job ${job.id} to ${job.data.to} `);
    try {
      await this.emailService.sendEmail(job.data);
      this.logger.log(`Email sent successfully to ${job.data.to} `);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_BOOKING_CREATED)
  async handleBookingCreated(job: Job<BookingEmailJobData>) {
    this.logger.debug(`Processing booking created for ${job.data.email}`);
    try {
      await this.emailService.sendBookingCreated(job.data.email, {
        userName: job.data.userName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        duration: job.data.duration || 30,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Booking created email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking created email: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_BOOKING_CONFIRMATION)
  async handleBookingConfirmation(job: Job<BookingEmailJobData>) {
    this.logger.debug(`Processing booking confirmation for ${job.data.email}`);
    try {
      await this.emailService.sendBookingConfirmation(job.data.email, {
        userName: job.data.userName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        duration: job.data.duration || 30,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Booking confirmation sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_BOOKING_REMINDER)
  async handleBookingReminder(job: Job<BookingEmailJobData>) {
    this.logger.debug(`Processing booking reminder for ${job.data.email}`);
    try {
      await this.emailService.sendBookingReminder(job.data.email, {
        userName: job.data.userName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Booking reminder sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send booking reminder: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_BOOKING_CANCELLATION)
  async handleBookingCancellation(job: Job<BookingEmailJobData>) {
    this.logger.debug(`Processing booking cancellation for ${job.data.email}`);
    try {
      await this.emailService.sendBookingCancellation(job.data.email, {
        userName: job.data.userName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Booking cancellation sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_ADMIN_NEW_BOOKING)
  async handleAdminNewBooking(job: Job<AdminBookingEmailJobData>) {
    this.logger.debug(`Processing admin new booking email for ${job.data.email}`);
    try {
      await this.emailService.sendNewBookingToAdmin(job.data.email, {
        adminName: job.data.adminName,
        clientName: job.data.clientName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Admin booking email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send admin booking email: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_ADMIN_CANCELLATION)
  async handleAdminCancellation(job: Job<AdminBookingEmailJobData>) {
    this.logger.debug(`Processing admin cancellation email for ${job.data.email}`);
    try {
      await this.emailService.sendCancellationToAdmin(job.data.email, {
        adminName: job.data.adminName,
        clientName: job.data.clientName,
        serviceName: job.data.serviceName,
        date: job.data.date,
        time: job.data.time,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Admin cancellation email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send admin cancellation email: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_PASSWORD_RESET)
  async handlePasswordReset(job: Job<PasswordResetEmailJobData>) {

    this.logger.debug(`Processing password reset for ${job.data.email}`);
    try {
      await this.emailService.sendPasswordReset(job.data.email, {
        userName: job.data.userName,
        resetUrl: job.data.resetUrl,
        expiresIn: job.data.expiresIn,
      });
      this.logger.log(`Password reset email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_PASSWORD_CHANGED)
  async handlePasswordChanged(job: Job<PasswordChangedEmailJobData>) {
    this.logger.debug(`Processing password changed for ${job.data.email}`);
    try {
      await this.emailService.sendPasswordChanged(job.data.email, {
        userName: job.data.userName,
      });
      this.logger.log(`Password changed email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send password changed email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_SUBSCRIPTION_CREATED)
  async handleSubscriptionCreated(job: Job<SubscriptionEmailJobData>) {
    this.logger.debug(`Processing subscription created for ${job.data.email}`);
    try {
      await this.emailService.sendSubscriptionCreated(job.data.email, {
        userName: job.data.userName,
        planName: job.data.planName,
        tenantName: job.data.tenantName,
        price: job.data.price || 0,
      });
      this.logger.log(`Subscription created email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send subscription created email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRING)
  async handleSubscriptionExpiring(job: Job<SubscriptionEmailJobData>) {
    this.logger.debug(`Processing subscription expiring for ${job.data.email}`);
    try {
      await this.emailService.sendSubscriptionExpiring(job.data.email, {
        userName: job.data.userName,
        planName: job.data.planName,
        tenantName: job.data.tenantName,
        expirationDate: job.data.expirationDate || '',
        daysRemaining: job.data.daysRemaining || 0,
      });
      this.logger.log(`Subscription expiring email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send subscription expiring email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRED)
  async handleSubscriptionExpired(job: Job<SubscriptionEmailJobData>) {
    this.logger.debug(`Processing subscription expired for ${job.data.email}`);
    try {
      await this.emailService.sendSubscriptionExpired(job.data.email, {
        userName: job.data.userName,
        planName: job.data.planName,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Subscription expired email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send subscription expired email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_SUBSCRIPTION_CANCELLED)
  async handleSubscriptionCancelled(job: Job<SubscriptionEmailJobData>) {
    this.logger.debug(`Processing subscription cancelled for ${job.data.email}`);
    try {
      await this.emailService.sendSubscriptionCancelled(job.data.email, {
        userName: job.data.userName,
        planName: job.data.planName,
        tenantName: job.data.tenantName,
      });
      this.logger.log(`Subscription cancelled email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send subscription cancelled email: ${error.message} `);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_PAYMENT_FAILED)
  async handlePaymentFailed(job: Job<SubscriptionEmailJobData>) {
    this.logger.debug(`Processing payment failed for ${job.data.email}`);
    try {
      await this.emailService.sendPaymentFailed(job.data.email, {
        userName: job.data.userName,
        planName: job.data.planName,
        tenantName: job.data.tenantName,
        amount: job.data.amount || 0,
      });
      this.logger.log(`Payment failed email sent to ${job.data.email} `);
    } catch (error) {
      this.logger.error(`Failed to send payment failed email: ${error.message} `);
      throw error;
    }
  }
}
