import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bull';
import { Notification, NotificationType } from '../../notifications/entities/notification.entity';
import { WebsocketsGateway } from '../../websockets/websockets.gateway';
import { QUEUE_NAMES, JOB_NAMES, CreateNotificationJobData } from '../constants/job.constants';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private websocketsGateway: WebsocketsGateway,
  ) {}

  /**
   * Crea una notificación in-app y la emite via WebSocket
   */
  @Process(JOB_NAMES.CREATE_NOTIFICATION)
  async handleCreateNotification(job: Job<CreateNotificationJobData>) {
    this.logger.debug(`Creating notification for user ${job.data.userId}`);

    try {
      const notification = this.notificationRepository.create({
        userId: job.data.userId,
        tenantId: job.data.tenantId,
        type: job.data.type as NotificationType,
        title: job.data.title,
        message: job.data.message,
        metadata: job.data.metadata,
        isRead: false,
      });

      await this.notificationRepository.save(notification);
      this.logger.log(`Notification created for user ${job.data.userId}: ${job.data.title}`);

      // Emitir notificación via WebSocket al usuario específico
      this.websocketsGateway.emitNotificationToUser(
        job.data.userId,
        notification,
      );
      
      return notification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`, error.stack);
      throw error;
    }
  }
}
