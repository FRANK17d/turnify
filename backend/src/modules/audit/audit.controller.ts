import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Obtener logs de auditoría con filtros
   */
  @Get()
  @RequirePermissions('VIEW_AUDIT')
  async findAll(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      tenantId: user.tenantId,
      userId,
      action,
      entity,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /**
   * Obtener actividad reciente
   */
  @Get('recent')
  @RequirePermissions('VIEW_AUDIT')
  async getRecentActivity(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getRecentActivity(
      user.tenantId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Obtener estadísticas de auditoría
   */
  @Get('stats')
  @RequirePermissions('VIEW_AUDIT')
  async getStats(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getStats(
      user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Obtener historial de una entidad específica
   */
  @Get('entity/:entity/:entityId')
  @RequirePermissions('VIEW_AUDIT')
  async getEntityHistory(
    @CurrentUser() user: any,
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(user.tenantId, entity, entityId);
  }
}
