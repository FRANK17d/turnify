import { Process, Processor, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, IsNull } from 'typeorm';
import type { Queue, Job } from 'bull';
import { Subscription, SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Plan } from '../../subscriptions/entities/plan.entity';
import { Notification, NotificationType } from '../../notifications/entities/notification.entity';
import { QUEUE_NAMES, JOB_NAMES, CreateNotificationJobData } from '../constants/job.constants';

@Processor(QUEUE_NAMES.SUBSCRIPTION)
export class SubscriptionProcessor {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private notificationQueue: Queue,
  ) {}

  /**
   * Verifica suscripciones que están por vencer en los próximos 7 días
   */
  @Process(JOB_NAMES.CHECK_EXPIRING_SUBSCRIPTIONS)
  async handleCheckExpiringSubscriptions(job: Job) {
    this.logger.log('Checking expiring subscriptions...');

    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Buscar suscripciones activas que vencen en los próximos 7 días
      const expiringSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: Between(now, in7Days),
          cancelAtPeriodEnd: true, // Solo las que no se renovarán
        },
        relations: ['plan'],
      });

      this.logger.log(`Found ${expiringSubscriptions.length} expiring subscriptions`);

      for (const subscription of expiringSubscriptions) {
        const tenant = await this.tenantRepository.findOne({
          where: { id: subscription.tenantId },
        });

        if (!tenant) continue;

        // Buscar admins del tenant
        const admins = await this.userRepository.find({
          where: { tenantId: subscription.tenantId, isActive: true, deletedAt: IsNull() },
          relations: ['roles'],
        });

        const adminUsers = admins.filter(u => 
          u.roles?.some(r => r.name === 'ADMIN_EMPRESA' || r.name === 'SUPER_ADMIN')
        );

        const daysRemaining = Math.ceil(
          (subscription.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        const expirationDate = subscription.currentPeriodEnd.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        for (const admin of adminUsers) {
          // Enviar email
          if (admin.emailNotifications) {
            await this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRING, {
              email: admin.email,
              userName: `${admin.firstName} ${admin.lastName}`,
              planName: subscription.plan?.name || 'Plan',
              tenantName: tenant.name,
              expirationDate,
              daysRemaining,
            });
          }

          // Crear notificación in-app
          if (admin.inAppNotifications) {
            await this.notificationQueue.add(JOB_NAMES.CREATE_NOTIFICATION, {
              userId: admin.id,
              tenantId: subscription.tenantId,
              type: NotificationType.SUBSCRIPTION_EXPIRING,
              title: 'Suscripción por vencer',
              message: `Tu suscripción vence en ${daysRemaining} días`,
              metadata: { subscriptionId: subscription.id, daysRemaining },
            } as CreateNotificationJobData);
          }
        }
      }

      this.logger.log(`Processed ${expiringSubscriptions.length} expiring subscriptions`);
      return { processed: expiringSubscriptions.length };
    } catch (error) {
      this.logger.error(`Error checking expiring subscriptions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verifica suscripciones que ya expiraron y las marca como CANCELED
   */
  @Process(JOB_NAMES.CHECK_EXPIRED_SUBSCRIPTIONS)
  async handleCheckExpiredSubscriptions(job: Job) {
    this.logger.log('Checking expired subscriptions...');

    try {
      const now = new Date();

      // Buscar suscripciones activas que ya pasaron su fecha de fin
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: LessThan(now),
          cancelAtPeriodEnd: true,
        },
        relations: ['plan'],
      });

      this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      for (const subscription of expiredSubscriptions) {
        // Actualizar estado a CANCELED
        subscription.status = SubscriptionStatus.CANCELED;
        await this.subscriptionRepository.save(subscription);

        const tenant = await this.tenantRepository.findOne({
          where: { id: subscription.tenantId },
        });

        if (!tenant) continue;

        // Buscar admins del tenant
        const admins = await this.userRepository.find({
          where: { tenantId: subscription.tenantId, isActive: true, deletedAt: IsNull() },
          relations: ['roles'],
        });

        const adminUsers = admins.filter(u => 
          u.roles?.some(r => r.name === 'ADMIN_EMPRESA' || r.name === 'SUPER_ADMIN')
        );

        for (const admin of adminUsers) {
          // Enviar email
          if (admin.emailNotifications) {
            await this.emailQueue.add(JOB_NAMES.SEND_SUBSCRIPTION_EXPIRED, {
              email: admin.email,
              userName: `${admin.firstName} ${admin.lastName}`,
              planName: subscription.plan?.name || 'Plan',
              tenantName: tenant.name,
            });
          }

          // Crear notificación in-app
          if (admin.inAppNotifications) {
            await this.notificationQueue.add(JOB_NAMES.CREATE_NOTIFICATION, {
              userId: admin.id,
              tenantId: subscription.tenantId,
              type: NotificationType.SUBSCRIPTION_EXPIRED,
              title: 'Suscripción expirada',
              message: 'Tu suscripción ha expirado. Renueva para recuperar el acceso completo.',
              metadata: { subscriptionId: subscription.id },
            } as CreateNotificationJobData);
          }
        }

        this.logger.log(`Subscription ${subscription.id} marked as expired`);
      }

      this.logger.log(`Processed ${expiredSubscriptions.length} expired subscriptions`);
      return { processed: expiredSubscriptions.length };
    } catch (error) {
      this.logger.error(`Error checking expired subscriptions: ${error.message}`, error.stack);
      throw error;
    }
  }
}
