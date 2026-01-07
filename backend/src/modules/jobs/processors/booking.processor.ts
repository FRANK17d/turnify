import { Process, Processor, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, MoreThan, LessThan } from 'typeorm';
import type { Queue, Job } from 'bull';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Notification, NotificationType } from '../../notifications/entities/notification.entity';
import { QUEUE_NAMES, JOB_NAMES, CreateNotificationJobData } from '../constants/job.constants';

@Processor(QUEUE_NAMES.BOOKING)
export class BookingProcessor {
  private readonly logger = new Logger(BookingProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private notificationQueue: Queue,
  ) {}

  /**
   * Procesa recordatorios de reservas
   * Busca reservas que están por ocurrir en las próximas 24 horas y envía recordatorios
   */
  @Process(JOB_NAMES.PROCESS_BOOKING_REMINDERS)
  async handleProcessBookingReminders(job: Job) {
    this.logger.log('Processing booking reminders...');

    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Buscar reservas pendientes/confirmadas en las próximas 24 horas
      const upcomingBookings = await this.bookingRepository.find({
        where: {
          status: BookingStatus.PENDING,
          deletedAt: IsNull(),
          startTime: Between(now, in24Hours),
        },
        relations: ['service', 'user'],
      });

      this.logger.log(`Found ${upcomingBookings.length} bookings to remind`);

      for (const booking of upcomingBookings) {
        // Verificar si el usuario tiene notificaciones email habilitadas
        const user = await this.userRepository.findOne({
          where: { id: booking.userId },
        });

        if (!user) continue;

        const tenant = await this.tenantRepository.findOne({
          where: { id: booking.tenantId },
        });

        const startDate = new Date(booking.startTime);
        const dateStr = startDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const timeStr = startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Enviar email si tiene habilitadas las notificaciones por correo
        if (user.emailNotifications) {
          await this.emailQueue.add(JOB_NAMES.SEND_BOOKING_REMINDER, {
            email: user.email,
            userName: `${user.firstName} ${user.lastName}`,
            serviceName: booking.service?.name || 'Servicio',
            date: dateStr,
            time: timeStr,
            tenantName: tenant?.name || 'Empresa',
            bookingId: booking.id,
          });
        }

        // Crear notificación in-app si tiene habilitadas
        if (user.inAppNotifications) {
          await this.notificationQueue.add(JOB_NAMES.CREATE_NOTIFICATION, {
            userId: user.id,
            tenantId: booking.tenantId,
            type: NotificationType.BOOKING_REMINDER,
            title: 'Recordatorio de Reserva',
            message: `Tu reserva de ${booking.service?.name} es mañana a las ${timeStr}`,
            metadata: { bookingId: booking.id },
          } as CreateNotificationJobData);
        }
      }

      this.logger.log(`Processed ${upcomingBookings.length} booking reminders`);
      return { processed: upcomingBookings.length };
    } catch (error) {
      this.logger.error(`Error processing booking reminders: ${error.message}`, error.stack);
      throw error;
    }
  }
}
