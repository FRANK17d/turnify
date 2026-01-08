import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { EmailService } from './services/email.service';
import { EmailQueueService } from './services/email-queue.service';
import { SchedulerService } from './services/scheduler.service';

// Entities
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Global()
@Module({
  imports: [
    // Scheduler module for cron jobs
    ScheduleModule.forRoot(),

    // Entities needed by services
    TypeOrmModule.forFeature([
      Booking,
      User,
      Tenant,
      Subscription,
      Plan,
      Notification,
    ]),
  ],
  providers: [
    // Services
    EmailService,
    EmailQueueService,
    SchedulerService,
  ],
  exports: [EmailQueueService, EmailService],
})
export class JobsModule { }
