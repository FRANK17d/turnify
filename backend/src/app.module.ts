import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, jwtConfig, redisConfig } from './config';
import { mailConfig } from './config/mail.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AuditModule } from './modules/audit/audit.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { WebsocketsModule } from './modules/websockets/websockets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';

// Entities
import { Tenant } from './modules/tenants/entities/tenant.entity';
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/roles/entities/role.entity';
import { Permission } from './modules/roles/entities/permission.entity';
import { Service } from './modules/services/entities/service.entity';
import { Booking } from './modules/bookings/entities/booking.entity';
import { Plan } from './modules/subscriptions/entities/plan.entity';
import { Subscription } from './modules/subscriptions/entities/subscription.entity';
import { Payment } from './modules/subscriptions/entities/payment.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { PasswordResetToken } from './modules/auth/entities/password-reset-token.entity';
import { Notification } from './modules/notifications/entities/notification.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, mailConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          Tenant,
          User,
          Role,
          Permission,
          Service,
          Booking,
          Plan,
          Subscription,
          Payment,
          AuditLog,
          RefreshToken,
          PasswordResetToken,
          Notification,
        ],
        synchronize: true, // Solo en desarrollo
        logging: false,
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Redis + BullMQ (siguiendo documentación oficial de Upstash)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('redis.host');
        const port = configService.get('redis.port');
        const password = configService.get('redis.password');
        const isUpstash = host?.includes('upstash');

        console.log(`[BullModule] Redis config: host=${host}, port=${port}, TLS=${isUpstash}`);

        return {
          redis: {
            host,
            port,
            password,
            // Según docs de Upstash: usar tls: {} para conexiones TLS
            tls: isUpstash ? {} : undefined,
            // Configuración recomendada para Bull con Redis cloud
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 30000,
            disconnectTimeout: 5000,
            keepAlive: 30000,
          },
        };
      },
    }),

    // Feature Modules
    RedisModule,
    AuditModule,
    JobsModule,
    WebsocketsModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    RolesModule,
    ServicesModule,
    BookingsModule,
    SubscriptionsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule { }
