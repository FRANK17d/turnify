import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../roles/entities/permission.entity';

interface PaginationQuery {
  limit?: number;
  offset?: number;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  /**
   * Obtener todas las notificaciones del usuario actual
   */
  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: PaginationQuery,
  ) {
    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const offset = query.offset ? Number(query.offset) : 0;
    return this.notificationsService.findAllForUser(userId, tenantId, limit, offset);
  }

  /**
   * Obtener notificaciones no leídas
   */
  @Get('unread')
  async findUnread(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.findUnreadForUser(userId, tenantId);
  }

  /**
   * Contar notificaciones no leídas
   */
  @Get('unread/count')
  async countUnread(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    const count = await this.notificationsService.countUnread(userId, tenantId);
    return { count };
  }

  /**
   * Obtener una notificación por ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.findOne(id, userId, tenantId);
  }

  /**
   * Marcar una notificación como leída
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId, tenantId);
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  @Post('mark-read')
  async markMultipleAsRead(
    @Body('ids') ids: string[],
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.markMultipleAsRead(ids, userId, tenantId);
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  @Post('mark-all-read')
  async markAllAsRead(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.markAllAsRead(userId, tenantId);
  }

  /**
   * Eliminar una notificación
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.remove(id, userId, tenantId);
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  @Delete('clear/read')
  async removeAllRead(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.removeAllRead(userId, tenantId);
  }

}
