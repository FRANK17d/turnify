import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { seedDatabase } from './seed';

import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Permission } from '../modules/roles/entities/permission.entity';
import { Service } from '../modules/services/entities/service.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { Plan } from '../modules/subscriptions/entities/plan.entity';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { Payment } from '../modules/subscriptions/entities/payment.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';

dotenv.config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'turnify',
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
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    await seedDatabase(dataSource);

    await dataSource.destroy();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runSeed();
