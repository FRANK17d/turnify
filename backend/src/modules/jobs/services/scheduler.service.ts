import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { EmailQueueService } from './email-queue.service';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { Subscription, SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly emailQueue: EmailQueueService,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Subscription) private subscriptionRepository: Repository<Subscription>,
  ) { }

  onModuleInit() {
    this.logger.log('Scheduler service initialized');
  }

  /**
   * Envía recordatorios de reservas cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleBookingReminders() {
    this.logger.log('Running scheduled booking reminders check');
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const bookings = await this.bookingRepository.find({
        where: {
          startTime: Between(inOneHour, inTwoHours),
          status: BookingStatus.CONFIRMED,
        },
        relations: ['user', 'service', 'tenant'],
      });

      for (const booking of bookings) {
        if (booking.user?.email) {
          await this.emailQueue.sendBookingReminder({
            email: booking.user.email,
            userName: `${booking.user.firstName} ${booking.user.lastName}`,
            serviceName: booking.service?.name || 'Servicio',
            date: booking.startTime.toLocaleDateString('es-ES'),
            time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            tenantName: booking.tenant?.name || 'Empresa',
          });
        }
      }

      this.logger.log(`Sent ${bookings.length} booking reminders`);
    } catch (error) {
      this.logger.error(`Error in booking reminders cron: ${error.message}`);
    }
  }

  /**
   * Verifica suscripciones por vencer diariamente a las 9:00 AM
   */
  @Cron('0 9 * * *')
  async handleExpiringSubscriptions() {
    this.logger.log('Running scheduled expiring subscriptions check');
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const subscriptions = await this.subscriptionRepository.find({
        where: {
          currentPeriodEnd: Between(now, in7Days),
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['tenant', 'plan'],
      });

      for (const sub of subscriptions) {
        const tenant = sub.tenant;
        if (tenant) {
          const daysRemaining = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

          await this.emailQueue.sendSubscriptionExpiringEmail({
            email: '', // Email will be sent when domain is verified
            userName: tenant.name,
            planName: sub.plan?.name || 'Plan',
            tenantName: tenant.name,
            expirationDate: sub.currentPeriodEnd.toLocaleDateString('es-ES'),
            daysRemaining,
          });
        }
      }

      this.logger.log(`Notified ${subscriptions.length} expiring subscriptions`);
    } catch (error) {
      this.logger.error(`Error in expiring subscriptions cron: ${error.message}`);
    }
  }

  /**
   * Verifica suscripciones expiradas cada 6 horas
   */
  @Cron('0 */6 * * *')
  async handleExpiredSubscriptions() {
    this.logger.log('Running scheduled expired subscriptions check');
    try {
      const now = new Date();

      const subscriptions = await this.subscriptionRepository.find({
        where: {
          currentPeriodEnd: LessThan(now),
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['tenant', 'plan'],
      });

      for (const sub of subscriptions) {
        sub.status = SubscriptionStatus.PAST_DUE;
        await this.subscriptionRepository.save(sub);

        const tenant = sub.tenant;
        if (tenant) {
          await this.emailQueue.sendSubscriptionExpiredEmail({
            email: '', // Email will be sent when domain is verified
            userName: tenant.name,
            planName: sub.plan?.name || 'Plan',
            tenantName: tenant.name,
          });
        }
      }

      this.logger.log(`Processed ${subscriptions.length} expired subscriptions`);
    } catch (error) {
      this.logger.error(`Error in expired subscriptions cron: ${error.message}`);
    }
  }

  /**
   * Log de estado cada 30 minutos
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async logStatus() {
    this.logger.debug('Scheduler running...');
  }
}
