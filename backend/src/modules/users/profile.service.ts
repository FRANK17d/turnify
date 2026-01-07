import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateNotificationPreferencesDto,
} from './dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) { }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: ['roles', 'roles.permissions', 'tenant'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Get the active subscription for the tenant
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        tenantId: user.tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => r.name),
      permissions: [
        ...new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.name))),
      ],
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        logo: user.tenant.logo,
        primaryColor: user.tenant.primaryColor,
        plan: activeSubscription?.plan?.name || 'FREE',
      },
      preferences: user.preferences || {
        emailNotifications: true,
        inAppNotifications: true,
        bookingReminders: true,
        subscriptionAlerts: true,
      },
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const oldValue = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };

    // Actualizar campos
    if (updateProfileDto.firstName) user.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) user.lastName = updateProfileDto.lastName;
    if (updateProfileDto.phone !== undefined) user.phone = updateProfileDto.phone;

    await this.userRepository.save(user);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Profile',
      user.id,
      user.id,
      user.tenantId,
      oldValue,
      updateProfileDto,
    );

    return { message: 'Perfil actualizado exitosamente' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    await this.userRepository.save(user);

    // Revocar todas las sesiones excepto la actual
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Password',
      user.id,
      user.id,
      user.tenantId,
      undefined,
      { action: 'password_changed' },
    );

    return {
      message: 'Contraseña actualizada exitosamente. Se han cerrado todas las sesiones activas.'
    };
  }

  async getNotificationPreferences(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      select: ['id', 'preferences'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return (
      user.preferences || {
        emailNotifications: true,
        inAppNotifications: true,
        bookingReminders: true,
        subscriptionAlerts: true,
      }
    );
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const oldValue = user.preferences;

    user.preferences = {
      ...(user.preferences || {}),
      ...dto,
    };

    await this.userRepository.save(user);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'NotificationPreferences',
      user.id,
      user.id,
      user.tenantId,
      oldValue,
      dto,
    );

    return {
      message: 'Preferencias de notificación actualizadas',
      preferences: user.preferences,
    };
  }

  private async createAuditLog(
    action: AuditAction,
    entity: string,
    entityId: string,
    userId: string,
    tenantId: string,
    oldValue?: any,
    newValue?: any,
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
