import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  async findAll(tenantId: string) {
    return this.userRepository.find({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['roles', 'roles.permissions'],
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.sanitizeUser(user);
  }

  async create(createUserDto: CreateUserDto, tenantId: string, createdBy: string) {
    const { email, password, firstName, lastName, phone, roleIds } = createUserDto;

    // Verificar si el email ya existe en el tenant
    const existingUser = await this.userRepository.findOne({
      where: { email, tenantId, deletedAt: IsNull() },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado en esta empresa');
    }

    // Obtener roles
    const roles = await this.roleRepository.find({
      where: [
        { id: In(roleIds), tenantId },
        { id: In(roleIds), isGlobal: true },
      ],
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Uno o más roles no existen');
    }

    // Verificar que no se asigne rol SUPER_ADMIN
    if (roles.some(r => r.name === 'SUPER_ADMIN')) {
      throw new ForbiddenException('No se puede asignar el rol SUPER_ADMIN');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      tenantId,
      roles,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'User',
      user.id,
      createdBy,
      tenantId,
      undefined,
      { email, firstName, lastName, roleIds },
    );

    return this.sanitizeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string, updatedBy: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const oldValue = this.sanitizeUser(user);

    // Actualizar roles si se proporcionan
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: [
          { id: In(updateUserDto.roleIds), tenantId },
          { id: In(updateUserDto.roleIds), isGlobal: true },
        ],
      });

      if (roles.some(r => r.name === 'SUPER_ADMIN')) {
        throw new ForbiddenException('No se puede asignar el rol SUPER_ADMIN');
      }

      user.roles = roles;
    }

    // Actualizar campos
    if (updateUserDto.firstName) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) user.lastName = updateUserDto.lastName;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

    await this.userRepository.save(user);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'User',
      user.id,
      updatedBy,
      tenantId,
      oldValue,
      updateUserDto,
    );

    return this.sanitizeUser(user);
  }

  async remove(id: string, tenantId: string, deletedBy: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Soft delete
    user.deletedAt = new Date();
    user.isActive = false;
    await this.userRepository.save(user);

    // Auditar
    await this.createAuditLog(
      AuditAction.DELETE,
      'User',
      user.id,
      deletedBy,
      tenantId,
      { email: user.email },
      undefined,
    );

    return { message: 'Usuario eliminado correctamente' };
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
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
