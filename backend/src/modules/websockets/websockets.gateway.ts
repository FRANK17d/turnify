import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

// WebSocket Events
export const WS_EVENTS = {
  // Server to Client
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  SUBSCRIPTION_EXPIRING: 'subscription.expiring',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  NOTIFICATION_NEW: 'notification.new',
  NOTIFICATION_READ: 'notification.read',
  USER_CONNECTED: 'user.connected',
  USER_DISCONNECTED: 'user.disconnected',

  // Client to Server
  JOIN_TENANT: 'join.tenant',
  LEAVE_TENANT: 'leave.tenant',
  MARK_NOTIFICATION_READ: 'mark.notification.read',
} as const;

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
    roles: string[];
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, restringir al dominio del frontend
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // tenantId -> Set<socketId>
  private userSockets = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraer token del handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verificar JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Asociar usuario al socket
      client.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        roles: payload.roles || [],
      };

      // Unir al room del tenant
      await client.join(`tenant:${payload.tenantId}`);
      await client.join(`user:${payload.sub}`);

      // Registrar cliente conectado
      if (!this.connectedClients.has(payload.tenantId)) {
        this.connectedClients.set(payload.tenantId, new Set());
      }
      this.connectedClients.get(payload.tenantId)!.add(client.id);
      this.userSockets.set(client.id, payload.sub);

      this.logger.log(
        `Client ${client.id} connected - User: ${payload.email}, Tenant: ${payload.tenantId}`,
      );

      // Notificar a admins del tenant que un usuario se conectó
      this.server.to(`tenant:${payload.tenantId}`).emit(WS_EVENTS.USER_CONNECTED, {
        userId: payload.sub,
        email: payload.email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(`Client ${client.id} authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const { tenantId, userId, email } = client.user;

      // Remover de los registros
      this.connectedClients.get(tenantId)?.delete(client.id);
      this.userSockets.delete(client.id);

      // Si no hay más clientes del tenant, limpiar
      if (this.connectedClients.get(tenantId)?.size === 0) {
        this.connectedClients.delete(tenantId);
      }

      this.logger.log(`Client ${client.id} disconnected - User: ${email}`);

      // Notificar a admins
      this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.USER_DISCONNECTED, {
        userId,
        email,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ==================== MÉTODOS DE EMISIÓN ====================

  /**
   * Emitir evento de reserva creada a todo el tenant
   */
  emitBookingCreated(tenantId: string, booking: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.BOOKING_CREATED, {
      booking,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted booking.created to tenant ${tenantId}`);
  }

  /**
   * Emitir evento de reserva actualizada
   */
  emitBookingUpdated(tenantId: string, booking: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.BOOKING_UPDATED, {
      booking,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted booking.updated to tenant ${tenantId}`);
  }

  /**
   * Emitir evento de reserva cancelada
   */
  emitBookingCancelled(tenantId: string, bookingId: string, userId: string) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.BOOKING_CANCELLED, {
      bookingId,
      userId,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted booking.cancelled to tenant ${tenantId}`);
  }

  /**
   * Emitir evento de suscripción por vencer
   */
  emitSubscriptionExpiring(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.SUBSCRIPTION_EXPIRING, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted subscription.expiring to tenant ${tenantId}`);
  }

  /**
   * Emitir evento de suscripción expirada
   */
  emitSubscriptionExpired(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.SUBSCRIPTION_EXPIRED, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted subscription.expired to tenant ${tenantId}`);
  }

  /**
   * Emitir evento de suscripción actualizada
   */
  emitSubscriptionUpdated(tenantId: string, subscription: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.SUBSCRIPTION_UPDATED, {
      subscription,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted subscription.updated to tenant ${tenantId}`);
  }

  /**
   * Emitir nueva notificación a un usuario específico
   */
  emitNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit(WS_EVENTS.NOTIFICATION_NEW, {
      notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification.new to user ${userId}`);
  }

  /**
   * Emitir nueva notificación a todos los admins del tenant
   */
  emitNotificationToTenant(tenantId: string, notification: any) {
    this.server.to(`tenant:${tenantId}`).emit(WS_EVENTS.NOTIFICATION_NEW, {
      notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification.new to tenant ${tenantId}`);
  }

  // ==================== HANDLERS DE MENSAJES DEL CLIENTE ====================

  @SubscribeMessage(WS_EVENTS.MARK_NOTIFICATION_READ)
  async handleMarkNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    // Emitir que la notificación fue leída (para sincronizar otras pestañas)
    this.server.to(`user:${client.user.userId}`).emit(WS_EVENTS.NOTIFICATION_READ, {
      notificationId: data.notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener número de clientes conectados por tenant
   */
  getConnectedClientsCount(tenantId: string): number {
    return this.connectedClients.get(tenantId)?.size || 0;
  }

  /**
   * Verificar si un usuario está conectado
   */
  isUserOnline(userId: string): boolean {
    for (const socketId of this.userSockets.keys()) {
      if (this.userSockets.get(socketId) === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtener todos los usuarios conectados de un tenant
   */
  getOnlineUsersForTenant(tenantId: string): string[] {
    const socketIds = this.connectedClients.get(tenantId);
    if (!socketIds) return [];

    const userIds = new Set<string>();
    socketIds.forEach((socketId) => {
      const userId = this.userSockets.get(socketId);
      if (userId) userIds.add(userId);
    });

    return Array.from(userIds);
  }
}
