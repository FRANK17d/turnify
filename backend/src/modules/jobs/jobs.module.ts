import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Constants
import { QUEUE_NAMES } from './constants/job.constants';

// Services
import { EmailService } from './services/email.service';
import { JobsService } from './services/jobs.service';
import { SchedulerService } from './services/scheduler.service';

// Processors
import { EmailProcessor } from './processors/email.processor';
import { BookingProcessor } from './processors/booking.processor';
import { SubscriptionProcessor } from './processors/subscription.processor';
import { NotificationProcessor } from './processors/notification.processor';

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

    // Register queues
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
        settings: {
          lockDuration: 300000, // 5 minutos
          stalledInterval: 300000, // 5 minutos
          maxStalledCount: 50,
        },
      },
      { name: QUEUE_NAMES.BOOKING },
      { name: QUEUE_NAMES.SUBSCRIPTION },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),

    // Entities needed by processors
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
    JobsService,
    SchedulerService,

    // Processors
    EmailProcessor,
    BookingProcessor,
    SubscriptionProcessor,
    NotificationProcessor,
  ],
  exports: [JobsService, EmailService],
})
export class JobsModule { }
