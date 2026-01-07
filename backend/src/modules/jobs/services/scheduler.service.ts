import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly jobsService: JobsService) {}

  onModuleInit() {
    this.logger.log('Scheduler service initialized');
  }

  /**
   * Envía recordatorios de reservas cada hora
   * Ejecuta a las :00 de cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleBookingReminders() {
    this.logger.log('Running scheduled booking reminders check');
    try {
      await this.jobsService.triggerBookingReminders();
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
      await this.jobsService.triggerExpiringSubscriptionsCheck();
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
      await this.jobsService.triggerExpiredSubscriptionsCheck();
    } catch (error) {
      this.logger.error(`Error in expired subscriptions cron: ${error.message}`);
    }
  }

  /**
   * Log de estado de las colas cada 30 minutos (solo para debugging)
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async logQueueStatus() {
    try {
      const status = await this.jobsService.getQueueStatus();
      this.logger.debug(`Queue status: ${JSON.stringify(status)}`);
    } catch (error) {
      this.logger.error(`Error getting queue status: ${error.message}`);
    }
  }
}
