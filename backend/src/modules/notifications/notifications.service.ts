import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { WebsocketsGateway } from '../websockets/websockets.gateway';

export interface CreateNotificationDto {
  userId: string;
  tenantId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private websocketsGateway: WebsocketsGateway,
  ) {}

  /**
   * Obtener todas las notificaciones del usuario
   */
  async findAllForUser(userId: string, tenantId: string, limit = 50, offset = 0) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId, tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: notifications,
      total,
      limit,
      offset,
    };
  }

  /**
   * Obtener notificaciones no leídas
   */
  async findUnreadForUser(userId: string, tenantId: string) {
    return this.notificationRepository.find({
      where: { userId, tenantId, isRead: false, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Contar notificaciones no leídas
   */
  async countUnread(userId: string, tenantId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, tenantId, isRead: false, deletedAt: IsNull() },
    });
  }

  /**
   * Obtener una notificación por ID
   */
  async findOne(id: string, userId: string, tenantId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta notificación');
    }

    return notification;
  }

  /**
   * Crear una nueva notificación y emitirla por WebSocket
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      tenantId: dto.tenantId,
      type: dto.type as NotificationType,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata,
      isRead: false,
    });

    await this.notificationRepository.save(notification);

    // Emitir por WebSocket al usuario
    this.websocketsGateway.emitNotificationToUser(dto.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    });

    this.logger.log(`Notification created for user ${dto.userId}: ${dto.title}`);
    return notification;
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string, userId: string, tenantId: string) {
    const notification = await this.findOne(id, userId, tenantId);

    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await this.notificationRepository.save(notification);

    this.logger.debug(`Notification ${id} marked as read by user ${userId}`);
    return notification;
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleAsRead(ids: string[], userId: string, tenantId: string) {
    await this.notificationRepository.update(
      {
        id: In(ids),
        userId,
        tenantId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { message: `${ids.length} notificaciones marcadas como leídas` };
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string, tenantId: string) {
    const result = await this.notificationRepository.update(
      { userId, tenantId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { message: `${result.affected || 0} notificaciones marcadas como leídas` };
  }

  /**
   * Eliminar una notificación (soft delete)
   */
  async remove(id: string, userId: string, tenantId: string) {
    const notification = await this.findOne(id, userId, tenantId);

    notification.deletedAt = new Date();
    await this.notificationRepository.save(notification);

    return { message: 'Notificación eliminada' };
  }

  /**
   * Eliminar todas las notificaciones leídas (soft delete)
   */
  async removeAllRead(userId: string, tenantId: string) {
    const result = await this.notificationRepository.update(
      { userId, tenantId, isRead: true, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    return { message: `${result.affected || 0} notificaciones eliminadas` };
  }

  // ==================== MÉTODOS HELPER PARA CREAR NOTIFICACIONES ESPECÍFICAS ====================

  /**
   * Notificación de reserva confirmada
   */
  async notifyBookingConfirmed(
    userId: string,
    tenantId: string,
    bookingId: string,
    serviceName: string,
    date: string,
  ) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Reserva Confirmada',
      message: `Tu reserva de ${serviceName} para el ${date} ha sido confirmada.`,
      metadata: { bookingId },
    });
  }

  /**
   * Notificación de reserva cancelada
   */
  async notifyBookingCancelled(
    userId: string,
    tenantId: string,
    bookingId: string,
    serviceName: string,
    date: string,
  ) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Reserva Cancelada',
      message: `Tu reserva de ${serviceName} para el ${date} ha sido cancelada.`,
      metadata: { bookingId },
    });
  }

  /**
   * Notificación de recordatorio de reserva
   */
  async notifyBookingReminder(
    userId: string,
    tenantId: string,
    bookingId: string,
    serviceName: string,
    date: string,
    time: string,
  ) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.BOOKING_REMINDER,
      title: 'Recordatorio de Reserva',
      message: `Recuerda que tienes una reserva de ${serviceName} mañana ${date} a las ${time}.`,
      metadata: { bookingId },
    });
  }

  /**
   * Notificación de suscripción por vencer
   */
  async notifySubscriptionExpiring(
    userId: string,
    tenantId: string,
    daysRemaining: number,
    planName: string,
  ) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      title: 'Suscripción por Vencer',
      message: `Tu suscripción al plan ${planName} vencerá en ${daysRemaining} días. Renuévala para no perder acceso.`,
      metadata: { daysRemaining, planName },
    });
  }

  /**
   * Notificación de suscripción expirada
   */
  async notifySubscriptionExpired(userId: string, tenantId: string, planName: string) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.SUBSCRIPTION_EXPIRED,
      title: 'Suscripción Expirada',
      message: `Tu suscripción al plan ${planName} ha expirado. Actualiza tu plan para recuperar todas las funcionalidades.`,
      metadata: { planName },
    });
  }

  /**
   * Notificación de pago fallido
   */
  async notifyPaymentFailed(userId: string, tenantId: string, amount: number) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Pago Fallido',
      message: `No pudimos procesar tu pago de $${amount.toFixed(2)}. Por favor, actualiza tu método de pago.`,
      metadata: { amount },
    });
  }

  /**
   * Notificación de sistema
   */
  async notifySystem(userId: string, tenantId: string, title: string, message: string) {
    return this.create({
      userId,
      tenantId,
      type: NotificationType.SYSTEM,
      title,
      message,
    });
  }
}
