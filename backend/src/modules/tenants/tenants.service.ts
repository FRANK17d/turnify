import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Tenant, TenantStatus } from './entities/tenant.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  // Solo Super Admin
  async findAll() {
    const tenants = await this.tenantRepository.createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.subscriptions', 'subscription', 'subscription.status = :status', { status: 'ACTIVE' })
      .leftJoinAndSelect('subscription.plan', 'plan')
      .loadRelationCountAndMap('tenant.usersCount', 'tenant.users')
      .loadRelationCountAndMap('tenant.bookingsCount', 'tenant.bookings')
      .loadRelationCountAndMap('tenant.servicesCount', 'tenant.services')
      .where('tenant.deletedAt IS NULL')
      .orderBy('tenant.createdAt', 'DESC')
      .getMany();

    // Mapear respuesta para el frontend
    return tenants.map(t => {
      const activeSubscription = t.subscriptions?.[0];
      return {
        ...t,
        subscription: activeSubscription ? {
          plan: activeSubscription.plan?.name || 'FREE', // Fallback seguro
          status: activeSubscription.status
        } : null,
        _count: {
          users: (t as any).usersCount || 0,
          bookings: (t as any).bookingsCount || 0,
          services: (t as any).servicesCount || 0,
        }
      };
    });
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('tenant.users', 'user')
      .leftJoinAndSelect('tenant.services', 'service')
      .leftJoinAndSelect('tenant.bookings', 'booking')
      .where('tenant.id = :id', { id })
      .andWhere('tenant.deletedAt IS NULL')
      .getOne();

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const activeSubscription = tenant.subscriptions?.find(s => s.status === 'ACTIVE') || tenant.subscriptions?.[0];

    return {
      ...tenant,
      subscription: activeSubscription ? {
        plan: activeSubscription.plan?.name || 'FREE',
        status: activeSubscription.status
      } : null
    };
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return tenant;
  }

  // Solo Super Admin puede crear tenants manualmente
  async create(createTenantDto: CreateTenantDto, userId: string) {
    const { name, slug, logo, primaryColor, timezone } = createTenantDto;

    // Verificar slug único
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException('El slug ya está en uso');
    }

    const tenant = this.tenantRepository.create({
      name,
      slug,
      logo,
      primaryColor: primaryColor || '#3B82F6',
      timezone: timezone || 'America/Lima',
      status: TenantStatus.ACTIVE,
    });

    await this.tenantRepository.save(tenant);

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'Tenant',
      tenant.id,
      userId,
      tenant.id,
      undefined,
      { name, slug },
    );

    return tenant;
  }

  // Admin de empresa puede actualizar su propio tenant
  // Super Admin puede actualizar cualquier tenant
  async update(id: string, updateTenantDto: UpdateTenantDto, userId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const oldValue = { ...tenant };

    // Actualizar campos
    Object.assign(tenant, updateTenantDto);
    await this.tenantRepository.save(tenant);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Tenant',
      tenant.id,
      userId,
      tenant.id,
      oldValue,
      updateTenantDto,
    );

    return tenant;
  }

  // Solo Super Admin
  async updateStatus(id: string, status: TenantStatus, userId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const oldStatus = tenant.status;
    tenant.status = status;
    await this.tenantRepository.save(tenant);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Tenant',
      tenant.id,
      userId,
      tenant.id,
      { status: oldStatus },
      { status },
    );

    return tenant;
  }

  // Solo Super Admin - Soft delete
  async remove(id: string, userId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    tenant.deletedAt = new Date();
    tenant.status = TenantStatus.SUSPENDED;
    await this.tenantRepository.save(tenant);

    // Auditar
    await this.createAuditLog(
      AuditAction.DELETE,
      'Tenant',
      tenant.id,
      userId,
      tenant.id,
      { name: tenant.name },
      undefined,
    );

    return { message: 'Empresa eliminada correctamente' };
  }

  // Para el tenant actual del usuario logueado
  async getMyTenant(tenantId: string) {
    return this.findOne(tenantId);
  }

  private async createAuditLog(
    action: AuditAction,
    entity: string,
    entityId: string,
    userId: string,
    tenantId: string,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      entity,
      entityId,
      userId,
      tenantId,
      oldValue,
      newValue,
    });
    await this.auditLogRepository.save(auditLog);
  }
}
