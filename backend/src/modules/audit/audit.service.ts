import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface AuditLogInput {
  userId?: string;
  tenantId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryParams {
  tenantId: string;
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  /**
   * Registra una entrada de auditoría
   */
  async log(input: AuditLogInput): Promise<AuditLog | null> {
    try {
      const auditLog = new AuditLog();
      auditLog.userId = input.userId;
      auditLog.tenantId = input.tenantId;
      auditLog.action = input.action;
      auditLog.entity = input.entity;
      auditLog.entityId = input.entityId;
      auditLog.oldValue = this.sanitizeData(input.oldValue);
      auditLog.newValue = this.sanitizeData(input.newValue);
      auditLog.ipAddress = input.ipAddress;
      auditLog.userAgent = input.userAgent;

      const saved = await this.auditLogRepository.save(auditLog);
      this.logger.debug(
        `Audit: ${input.action} on ${input.entity}${input.entityId ? `(${input.entityId})` : ''} by user ${input.userId || 'anonymous'}`,
      );
      return saved;
    } catch (error) {
      this.logger.error(`Error creating audit log: ${error.message}`, error.stack);
      // No lanzamos error para no interrumpir el flujo principal
      return null;
    }
  }

  /**
   * Registra un login exitoso
   */
  async logLogin(
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.LOGIN,
      entity: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra un intento de login fallido
   */
  async logLoginFailed(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      action: AuditAction.LOGIN_FAILED,
      entity: 'auth',
      newValue: { email, reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra un logout
   */
  async logLogout(
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.LOGOUT,
      entity: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra un reset de contraseña
   */
  async logPasswordReset(
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.PASSWORD_RESET,
      entity: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra creación de entidad
   */
  async logCreate(
    entity: string,
    entityId: string,
    newValue: Record<string, any>,
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.CREATE,
      entity,
      entityId,
      newValue,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra actualización de entidad
   */
  async logUpdate(
    entity: string,
    entityId: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.UPDATE,
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra eliminación (soft delete) de entidad
   */
  async logDelete(
    entity: string,
    entityId: string,
    oldValue: Record<string, any>,
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog | null> {
    return this.log({
      userId,
      tenantId,
      action: AuditAction.DELETE,
      entity,
      entityId,
      oldValue,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async findAll(params: AuditQueryParams) {
    const {
      tenantId,
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: any = { tenantId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs.map(log => ({
        ...log,
        entityType: log.entity, // Alias for frontend compatibility
        user: log.user ? {
          firstName: log.user.firstName,
          lastName: log.user.lastName,
          email: log.user.email,
        } : { firstName: 'Sistema', lastName: '', email: '' },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene historial de cambios de una entidad específica
   */
  async getEntityHistory(
    tenantId: string,
    entity: string,
    entityId: string,
  ) {
    return this.auditLogRepository.find({
      where: { tenantId, entity, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene actividad reciente del tenant
   */
  async getRecentActivity(tenantId: string, limit = 20) {
    return this.auditLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('audit.entity', 'entity')
      .addSelect('COUNT(*)', 'count')
      .where('audit.tenantId = :tenantId', { tenantId });

    if (startDate && endDate) {
      queryBuilder.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const stats = await queryBuilder
      .groupBy('audit.action')
      .addGroupBy('audit.entity')
      .getRawMany();

    return stats;
  }

  /**
   * Elimina datos sensibles antes de guardar
   */
  private sanitizeData(data: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!data) return undefined;

    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
