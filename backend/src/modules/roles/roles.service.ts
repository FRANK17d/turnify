import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  // Obtener roles del tenant (incluye roles globales)
  async findAll(tenantId: string) {
    console.log('RolesService.findAll called with tenantId:', tenantId);

    // Explicitly build the where conditions to avoid issues with undefined values
    const whereConditions: any[] = [
      { isGlobal: true, deletedAt: IsNull() }
    ];

    if (tenantId) {
      whereConditions.push({ tenantId, deletedAt: IsNull() });
    }

    const roles = await this.roleRepository.find({
      where: whereConditions,
      relations: ['permissions'],
      order: { isGlobal: 'DESC', name: 'ASC' },
    });

    console.log('RolesService.findAll found roles:', roles.length);
    if (roles.length > 0) {
      console.log('Roles found:', roles.map(r => r.name).join(', '));
    }

    return roles;
  }

  // Obtener todos los permisos (para mostrar en UI)
  async findAllPermissions() {
    return this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.roleRepository.findOne({
      where: [
        { id, tenantId, deletedAt: IsNull() },
        { id, isGlobal: true, deletedAt: IsNull() },
      ],
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  // Crear rol personalizado para el tenant
  async create(createRoleDto: CreateRoleDto, tenantId: string, userId: string) {
    const { name, description, permissionIds } = createRoleDto;

    // No permitir crear roles con nombres reservados
    const reservedNames = ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'CLIENTE'];
    if (reservedNames.includes(name.toUpperCase())) {
      throw new ForbiddenException('No se puede usar un nombre de rol reservado');
    }

    // Verificar nombre único en el tenant
    const existingRole = await this.roleRepository.findOne({
      where: { name, tenantId, deletedAt: IsNull() },
    });

    if (existingRole) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    // Obtener permisos
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    // Filtrar permisos de super admin
    const safePermissions = permissions.filter(p => p.name !== 'SUPER_ADMIN');

    const role = this.roleRepository.create({
      name,
      description,
      tenantId,
      isGlobal: false,
      permissions: safePermissions,
    });

    await this.roleRepository.save(role);

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'Role',
      role.id,
      userId,
      tenantId,
      undefined,
      { name, permissionIds: safePermissions.map(p => p.id) },
    );

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string, userId: string) {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // No permitir editar roles globales
    if (role.isGlobal) {
      throw new ForbiddenException('No se pueden editar roles globales');
    }

    const oldValue = {
      name: role.name,
      permissions: role.permissions.map(p => p.name),
    };

    // Actualizar nombre si se proporciona
    if (updateRoleDto.name) {
      const reservedNames = ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'CLIENTE'];
      if (reservedNames.includes(updateRoleDto.name.toUpperCase())) {
        throw new ForbiddenException('No se puede usar un nombre de rol reservado');
      }
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    // Actualizar permisos si se proporcionan
    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(updateRoleDto.permissionIds) },
      });
      role.permissions = permissions.filter(p => p.name !== 'SUPER_ADMIN');
    }

    await this.roleRepository.save(role);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Role',
      role.id,
      userId,
      tenantId,
      oldValue,
      {
        name: role.name,
        permissions: role.permissions.map(p => p.name),
      },
    );

    return role;
  }

  async remove(id: string, tenantId: string, userId: string) {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isGlobal) {
      throw new ForbiddenException('No se pueden eliminar roles globales');
    }

    // Soft delete
    role.deletedAt = new Date();
    await this.roleRepository.save(role);

    // Auditar
    await this.createAuditLog(
      AuditAction.DELETE,
      'Role',
      role.id,
      userId,
      tenantId,
      { name: role.name },
      undefined,
    );

    return { message: 'Rol eliminado correctamente' };
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
