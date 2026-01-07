import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Service } from './entities/service.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(tenantId: string) {
    return this.serviceRepository.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findAllActive(tenantId: string) {
    return this.serviceRepository.find({
      where: { tenantId, isActive: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.serviceRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async create(createServiceDto: CreateServiceDto, tenantId: string, userId: string) {
    const { name, description, price, duration, isActive = true } = createServiceDto;

    // Verificar nombre único en el tenant
    const existingService = await this.serviceRepository.findOne({
      where: { name, tenantId, deletedAt: IsNull() },
    });

    if (existingService) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }

    const service = this.serviceRepository.create({
      name,
      description,
      price,
      duration,
      isActive,
      tenantId,
    });

    await this.serviceRepository.save(service);

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'Service',
      service.id,
      userId,
      tenantId,
      undefined,
      { name, price, duration },
    );

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, tenantId: string, userId: string) {
    const service = await this.serviceRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const oldValue = { ...service };

    // Verificar nombre único si se cambia
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: { name: updateServiceDto.name, tenantId, deletedAt: IsNull() },
      });

      if (existingService) {
        throw new ConflictException('Ya existe un servicio con ese nombre');
      }
    }

    // Actualizar campos
    Object.assign(service, updateServiceDto);
    await this.serviceRepository.save(service);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Service',
      service.id,
      userId,
      tenantId,
      oldValue,
      updateServiceDto,
    );

    return service;
  }

  async remove(id: string, tenantId: string, userId: string) {
    const service = await this.serviceRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Soft delete
    service.deletedAt = new Date();
    await this.serviceRepository.save(service);

    // Auditar
    await this.createAuditLog(
      AuditAction.DELETE,
      'Service',
      service.id,
      userId,
      tenantId,
      { name: service.name },
      undefined,
    );

    return { message: 'Servicio eliminado correctamente' };
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
