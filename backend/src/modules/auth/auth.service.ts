import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity';
import { Role } from '../roles/entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { RedisService } from '../redis/redis.service';
import { JobsService } from '../jobs/services/jobs.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 15 * 60; // 15 minutos en segundos

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private auditService: AuditService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private jobsService: JobsService,
    private dataSource: DataSource,
  ) { }

  // ==================== LOGIN ====================
  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const { email, password, rememberMe } = loginDto;

    // Verificar bloqueo por intentos fallidos
    const lockKey = `login:lock:${email}:${ip}`;
    const attemptsKey = `login:attempts:${email}:${ip}`;

    const isLocked = await this.redisService.get(lockKey);
    if (isLocked) {
      const ttl = await this.redisService.ttl(lockKey);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${Math.ceil(ttl / 60)} minutos.`,
      );
    }

    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenant', 'roles', 'roles.permissions'],
    });

    // Verificar credenciales (respuesta genérica para seguridad)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.handleFailedLogin(email, ip, user?.id, user?.tenantId);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Verificar estado del tenant
    if (user.tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException('La empresa ha sido suspendida');
    }

    // Resetear intentos fallidos
    await this.redisService.del(attemptsKey);

    // Generar tokens (con expiración extendida si rememberMe está activado)
    const tokens = await this.generateTokens(user, ip, userAgent, rememberMe);

    // Auditar login exitoso
    await this.createAuditLog(
      AuditAction.LOGIN,
      'User',
      user.id,
      user.id,
      user.tenantId,
      undefined,
      { email: user.email },
      ip,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ==================== REGISTRO ====================
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, tenantName } = registerDto;

    // Verificar si email ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear en transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear tenant
      const slug = this.generateSlug(tenantName);
      const tenant = queryRunner.manager.create(Tenant, {
        name: tenantName,
        slug,
        status: TenantStatus.ACTIVE,
      });
      await queryRunner.manager.save(tenant);

      // Buscar rol ADMIN_EMPRESA
      let adminRole = await this.roleRepository.findOne({
        where: { name: 'ADMIN_EMPRESA' },
      });

      // Si no existe, crearlo
      if (!adminRole) {
        adminRole = queryRunner.manager.create(Role, {
          name: 'ADMIN_EMPRESA',
          description: 'Administrador de empresa',
          isSystem: true,
        });
        await queryRunner.manager.save(adminRole);
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = queryRunner.manager.create(User, {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        tenantId: tenant.id,
        isActive: true,
        roles: [adminRole],
      });
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return {
        message: 'Registro exitoso',
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== REFRESH TOKEN ====================
  async refreshTokens(refreshTokenDto: RefreshTokenDto, ip: string, userAgent: string) {
    const { refreshToken } = refreshTokenDto;

    // Buscar el refresh token
    const tokenHash = await this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user', 'user.tenant', 'user.roles', 'user.roles.permissions'],
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Verificar usuario activo
    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Revocar token actual
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generar nuevos tokens
    const tokens = await this.generateTokens(storedToken.user, ip, userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(storedToken.user),
    };
  }

  // ==================== LOGOUT ====================
  async logout(refreshToken: string, userId: string) {
    const tokenHash = await this.hashToken(refreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash, userId },
      { isRevoked: true },
    );
    return { message: 'Sesión cerrada exitosamente' };
  }

  // ==================== LOGOUT ALL ====================
  async logoutAll(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return { message: 'Todas las sesiones han sido cerradas' };
  }

  // ==================== FORGOT PASSWORD ====================
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, ip: string) {
    const { email } = forgotPasswordDto;

    // Respuesta genérica (no revelar si email existe)
    const genericResponse = {
      message: 'Si el correo existe, se enviaron instrucciones de recuperación',
    };

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return genericResponse;
    }

    // Generar token único
    const token = uuidv4();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Invalidar tokens anteriores
    await this.passwordResetTokenRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    // Guardar nuevo token
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    // Enviar email con el token
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

      await this.jobsService.sendPasswordResetEmail({
        email: user.email,
        userName: user.firstName || user.email,
        resetUrl,
        expiresIn: '30 minutos',
      });
    } catch (error) {
      console.error('Error enviando email de recuperación:', error);
    }


    // Auditar
    await this.createAuditLog(
      AuditAction.PASSWORD_RESET,
      'User',
      user.id,
      user.id,
      user.tenantId,
      undefined,
      { action: 'requested' },
      ip,
      undefined,
    );

    return genericResponse;
  }

  // ==================== RESET PASSWORD ====================
  async resetPassword(resetPasswordDto: ResetPasswordDto, ip: string) {
    const { token, newPassword } = resetPasswordDto;

    const tokenHash = await this.hashToken(token);
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(resetToken.userId, {
      password: hashedPassword,
    });

    // Marcar token como usado
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Revocar todas las sesiones
    await this.refreshTokenRepository.update(
      { userId: resetToken.userId },
      { isRevoked: true },
    );

    // Enviar email de confirmación de cambio
    try {
      await this.jobsService.sendPasswordChangedEmail({
        email: resetToken.user.email,
        userName: resetToken.user.firstName || resetToken.user.email,
      });
    } catch (error) {
      console.error('Error enviando email de cambio de contraseña:', error);
    }

    // Auditar
    await this.createAuditLog(
      AuditAction.PASSWORD_RESET,
      'User',
      resetToken.userId,
      resetToken.userId,
      resetToken.user.tenantId,
      undefined,
      { action: 'completed' },
      ip,
      undefined,
    );

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // ==================== GET SESSIONS ====================
  async getSessions(userId: string) {
    const sessions = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      select: ['id', 'deviceInfo', 'ipAddress', 'createdAt', 'expiresAt'],
      order: { createdAt: 'DESC' },
    });
    return sessions;
  }

  // ==================== REVOKE SESSION ====================
  async revokeSession(userId: string, sessionId: string) {
    const result = await this.refreshTokenRepository.update(
      { id: sessionId, userId },
      { isRevoked: true },
    );
    if (result.affected === 0) {
      throw new BadRequestException('Sesión no encontrada');
    }
    return { message: 'Sesión revocada exitosamente' };
  }

  // ==================== HELPERS ====================

  private async generateTokens(user: User, ip: string, userAgent: string, rememberMe: boolean = false) {
    // Extraer permisos de roles
    const permissions = user.roles?.flatMap(
      (role) => role.permissions?.map((p) => p.name) || [],
    ) || [];
    const roles = user.roles?.map((r) => r.name) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
      permissions: [...new Set(permissions)],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    const refreshToken = uuidv4();
    const tokenHash = await this.hashToken(refreshToken);

    // Calcular expiración del refresh token
    // Si rememberMe está activado, usar 30 días, sino usar la configuración por defecto
    const refreshExpiresIn = rememberMe ? '30' : this.configService.get('jwt.refreshExpiresIn');
    const days = parseInt(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Parsear User-Agent a formato legible
    const deviceInfo = this.parseUserAgent(userAgent);

    // Revocar sesiones anteriores del mismo dispositivo/navegador
    await this.refreshTokenRepository.update(
      { userId: user.id, deviceInfo, isRevoked: false },
      { isRevoked: true },
    );

    // Guardar refresh token
    const storedRefreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      deviceInfo,
      ipAddress: ip,
      expiresAt,
    });
    await this.refreshTokenRepository.save(storedRefreshToken);

    return { accessToken, refreshToken };
  }

  private parseUserAgent(userAgent: string): string {
    if (!userAgent || userAgent === 'unknown') {
      return 'Dispositivo desconocido';
    }

    let browser = 'Navegador desconocido';
    let os = 'Sistema desconocido';

    // Detectar navegador
    if (userAgent.includes('Edg/')) {
      browser = 'Edge';
    } else if (userAgent.includes('Chrome/')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox/')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      browser = 'Safari';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) {
      browser = 'Opera';
    }

    // Detectar sistema operativo
    if (userAgent.includes('Windows NT 10')) {
      os = 'Windows 10/11';
    } else if (userAgent.includes('Windows NT')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      os = 'macOS';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    }

    return `${browser} en ${os}`;
  }

  private async handleFailedLogin(
    email: string,
    ip: string,
    userId?: string,
    tenantId?: string,
  ) {
    const attemptsKey = `login:attempts:${email}:${ip}`;
    const lockKey = `login:lock:${email}:${ip}`;

    const attempts = await this.redisService.incr(attemptsKey);
    await this.redisService.expire(attemptsKey, this.LOCKOUT_TIME);

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.redisService.set(lockKey, '1', this.LOCKOUT_TIME);

      // Auditar bloqueo
      await this.createAuditLog(
        AuditAction.LOGIN_FAILED,
        'User',
        userId,
        userId,
        tenantId,
        undefined,
        { email, reason: 'account_locked', attempts },
        ip,
        undefined,
      );
    } else {
      // Auditar intento fallido
      await this.createAuditLog(
        AuditAction.LOGIN_FAILED,
        'User',
        userId,
        userId,
        tenantId,
        undefined,
        { email, attempts },
        ip,
        undefined,
      );
    }
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private sanitizeUser(user: User) {
    const permissions = user.roles?.flatMap(
      (role) => role.permissions?.map((p) => p.name) || [],
    ) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      tenantStatus: user.tenant?.status,
      roles: user.roles?.map((r) => r.name) || [],
      permissions: [...new Set(permissions)],
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }

  private async createAuditLog(
    action: AuditAction,
    entity: string,
    entityId?: string,
    userId?: string,
    tenantId?: string,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.auditService.log({
      action,
      entity,
      entityId,
      userId,
      tenantId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
    });
  }
}
