import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './services/subscriptions.service';
import { StripeService } from './services/stripe.service';
import { SubscriptionGuard } from './guards/subscription.guard';

import { Subscription } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { Payment } from './entities/payment.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Subscription,
      Plan,
      Payment,
      Tenant,
      AuditLog,
      Booking,
      Service,
      User,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService, SubscriptionGuard],
  exports: [SubscriptionsService, StripeService, SubscriptionGuard],
})
export class SubscriptionsModule {}
