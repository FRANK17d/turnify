import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, Not, LessThan, MoreThan } from 'typeorm';

import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { AuditLog, AuditAction } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { JobsService } from '../jobs/services/jobs.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { CreateBookingDto, UpdateBookingDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,

    private jobsService: JobsService,
    private websocketsGateway: WebsocketsGateway, // Se mantiene gateway por los eventos emitBookingCreated que no son notificaciones de usuario sino de admin
    private notificationsService: NotificationsService,
  ) { }

  // Obtener todas las reservas del tenant (admin)
  async findAll(tenantId: string) {
    return this.bookingRepository.find({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['service', 'user'],
      order: { startTime: 'DESC' },
    });
  }

  // Obtener reservas del usuario (cliente)
  async findMyBookings(userId: string, tenantId: string) {
    return this.bookingRepository.find({
      where: { userId, tenantId, deletedAt: IsNull() },
      relations: ['service'],
      order: { startTime: 'DESC' },
    });
  }

  // Obtener reservas por rango de fechas
  async findByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.bookingRepository.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
        startTime: Between(startDate, endDate),
      },
      relations: ['service', 'user'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string, userId?: string, isAdmin = false) {
    const booking = await this.bookingRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['service', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Si no es admin, solo puede ver sus propias reservas
    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    return booking;
  }

  async create(createBookingDto: CreateBookingDto, userId: string, tenantId: string) {
    const { serviceId, startTime, notes } = createBookingDto;

    // Verificar que el servicio existe y está activo
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, tenantId, isActive: true, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado o no disponible');
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

    // Validar que la fecha no sea en el pasado
    if (startDateTime < new Date()) {
      throw new BadRequestException('No se pueden crear reservas en el pasado');
    }

    // Verificar disponibilidad (que no haya otra reserva en ese horario)
    const conflictingBooking = await this.bookingRepository.findOne({
      where: [
        {
          tenantId,
          serviceId,
          deletedAt: IsNull(),
          status: Not(BookingStatus.CANCELLED),
          startTime: LessThan(endDateTime),
          endTime: MoreThan(startDateTime),
        },
      ],
    });

    if (conflictingBooking) {
      throw new BadRequestException('El horario seleccionado no está disponible');
    }

    // Crear reserva
    const booking = this.bookingRepository.create({
      serviceId,
      userId,
      tenantId,
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
      status: BookingStatus.PENDING,
    });

    await this.bookingRepository.save(booking);

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'Booking',
      booking.id,
      userId,
      tenantId,
      undefined,
      { serviceId, startTime, status: BookingStatus.PENDING },
    );

    // Enviar email de creación (pendiente) al cliente
    await this.sendBookingCreatedEmail(booking, service, userId, tenantId, userId);

    // Notificar a los administradores
    const clientUser = await this.userRepository.findOne({ where: { id: userId } });
    if (clientUser) {
      this.notifyAdminsOfNewBooking(booking, service, clientUser, tenantId, userId);
    }

    // Cargar relaciones para la respuesta
    const savedBooking = await this.bookingRepository.findOne({
      where: { id: booking.id },
      relations: ['service', 'user'],
    });

    // Emitir evento WebSocket de reserva creada
    this.websocketsGateway.emitBookingCreated(tenantId, savedBooking);

    return savedBooking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    tenantId: string,
    userId: string,
    isAdmin = false,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar permisos
    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }

    // No permitir modificar reservas canceladas o completadas
    if ([BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(booking.status)) {
      throw new BadRequestException('No se puede modificar una reserva cancelada o completada');
    }

    const oldValue = { ...booking };

    // Actualizar horario si se proporciona
    if (updateBookingDto.startTime) {
      const startDateTime = new Date(updateBookingDto.startTime);
      const endDateTime = new Date(startDateTime.getTime() + booking.service.duration * 60000);

      if (startDateTime < new Date()) {
        throw new BadRequestException('No se pueden crear reservas en el pasado');
      }

      // Verificar disponibilidad (excluyendo esta reserva)
      const conflictingBooking = await this.bookingRepository.findOne({
        where: {
          tenantId,
          serviceId: booking.serviceId,
          id: Not(id),
          deletedAt: IsNull(),
          status: Not(BookingStatus.CANCELLED),
          startTime: LessThan(endDateTime),
          endTime: MoreThan(startDateTime),
        },
      });

      if (conflictingBooking) {
        throw new BadRequestException('El horario seleccionado no está disponible');
      }

      booking.startTime = startDateTime;
      booking.endTime = endDateTime;
    }

    // Actualizar otros campos
    if (updateBookingDto.notes !== undefined) booking.notes = updateBookingDto.notes;
    if (updateBookingDto.status && isAdmin) booking.status = updateBookingDto.status;

    await this.bookingRepository.save(booking);

    // Enviar confirmación si el estado cambió a CONFIRMED
    if (oldValue.status !== BookingStatus.CONFIRMED && booking.status === BookingStatus.CONFIRMED) {
      await this.sendBookingConfirmationEmail(booking, booking.service, booking.userId, tenantId, userId);
    }

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Booking',
      booking.id,
      userId,
      tenantId,
      { status: oldValue.status, startTime: oldValue.startTime },
      updateBookingDto,
    );

    const updatedBooking = await this.bookingRepository.findOne({
      where: { id: booking.id },
      relations: ['service', 'user'],
    });

    // Emitir evento WebSocket de reserva actualizada
    this.websocketsGateway.emitBookingUpdated(tenantId, updatedBooking);

    return updatedBooking;
  }

  async cancel(id: string, tenantId: string, userId: string, isAdmin = false) {
    const booking = await this.bookingRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['service', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    const oldStatus = booking.status;
    booking.status = BookingStatus.CANCELLED;
    await this.bookingRepository.save(booking);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Booking',
      booking.id,
      userId,
      tenantId,
      { status: oldStatus },
      { status: BookingStatus.CANCELLED },
    );

    // Enviar email de cancelación (async)
    await this.sendBookingCancellationEmail(booking, booking.userId, tenantId, userId);

    // Emitir evento WebSocket de reserva cancelada
    this.websocketsGateway.emitBookingCancelled(tenantId, booking.id, userId);

    // Notificar a administradores
    if (booking.service && booking.user) {
      this.notifyAdminsOfCancellation(booking, booking.service, booking.user, tenantId, userId);
    }

    return { message: 'Reserva cancelada correctamente' };
  }

  async remove(id: string, tenantId: string, userId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Soft delete
    booking.deletedAt = new Date();
    await this.bookingRepository.save(booking);

    // Auditar
    await this.createAuditLog(
      AuditAction.DELETE,
      'Booking',
      booking.id,
      userId,
      tenantId,
      { id: booking.id },
      undefined,
    );

    return { message: 'Reserva eliminada correctamente' };
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

  private async sendBookingCreatedEmail(
    booking: Booking,
    service: Service,
    userId: string,
    tenantId: string,
    triggeringUserId?: string,
  ) {
    try {
      const [user, tenant] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] }),
        this.tenantRepository.findOne({ where: { id: tenantId } }),
      ]);

      if (triggeringUserId && user && user.id === triggeringUserId) {
        const isAdmin = user.roles?.some(r => ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(r.name));
        if (isAdmin) return;
      }

      if (user?.email && tenant) {
        await this.jobsService.sendBookingCreated({
          email: user.email,
          userName: user.firstName || user.email,
          serviceName: service.name,
          date: booking.startTime.toLocaleDateString('es-ES'),
          time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: service.duration,
          tenantName: tenant.name,
          bookingId: booking.id,
        });

        // Crear notificación in-app (DIRECTO)
        await this.notificationsService.create({
          userId,
          tenantId,
          type: NotificationType.BOOKING_CREATED,
          title: 'Reserva Creada',
          message: `Tu reserva de ${service.name} para el ${booking.startTime.toLocaleDateString('es-ES')} ha sido creada y está pendiente de confirmación.`,
          metadata: { bookingId: booking.id, serviceId: service.id },
        });
      }
    } catch (error) {
      console.error('Error enviando email de creación de reserva:', error);
    }
  }

  private async sendBookingConfirmationEmail(
    booking: Booking,
    service: Service,
    userId: string,
    tenantId: string,
    triggeringUserId?: string,
  ) {
    try {
      const [user, tenant] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] }),
        this.tenantRepository.findOne({ where: { id: tenantId } }),
      ]);

      if (triggeringUserId && user && user.id === triggeringUserId) {
        const isAdmin = user.roles?.some(r => ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(r.name));
        if (isAdmin) return;
      }

      if (user?.email && tenant) {
        await this.jobsService.sendBookingConfirmation({
          email: user.email,
          userName: user.firstName || user.email,
          serviceName: service.name,
          date: booking.startTime.toLocaleDateString('es-ES'),
          time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: service.duration,
          tenantName: tenant.name,
          bookingId: booking.id,
        });

        // Crear notificación in-app (DIRECTO)
        await this.notificationsService.create({
          userId,
          tenantId,
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Reserva Confirmada',
          message: `Tu reserva de ${service.name} para el ${booking.startTime.toLocaleDateString('es-ES')} ha sido confirmada.`,
          metadata: { bookingId: booking.id, serviceId: service.id },
        });
      }
    } catch (error) {
      // No interrumpir el flujo si falla el email
      console.error('Error enviando email de confirmación:', error);
    }
  }

  private async sendBookingCancellationEmail(
    booking: Booking,
    userId: string,
    tenantId: string,
    triggeringUserId?: string,
  ) {
    try {
      const [user, tenant, service] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] }),
        this.tenantRepository.findOne({ where: { id: tenantId } }),
        this.serviceRepository.findOne({ where: { id: booking.serviceId } }),
      ]);

      // Silenciar si es admin actuando sobre sí mismo
      if (triggeringUserId && user && user.id === triggeringUserId) {
        const isAdmin = user.roles?.some(r => ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(r.name));
        if (isAdmin) return;
      }

      if (user?.email && tenant && service) {
        await this.jobsService.sendBookingCancellation({
          email: user.email,
          userName: user.firstName || user.email,
          serviceName: service.name,
          date: booking.startTime.toLocaleDateString('es-ES'),
          time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: service.duration,
          tenantName: tenant.name,
          bookingId: booking.id,
        });

        // Crear notificación in-app (DIRECTO)
        await this.notificationsService.create({
          userId,
          tenantId,
          type: NotificationType.BOOKING_CANCELLED,
          title: 'Reserva Cancelada',
          message: `Tu reserva de ${service.name} para el ${booking.startTime.toLocaleDateString('es-ES')} ha sido cancelada.`,
          metadata: { bookingId: booking.id, serviceId: service.id },
        });
      }
    } catch (error) {
      // No interrumpir el flujo si falla el email
      console.error('Error enviando email de cancelación:', error);
    }
  }

  private async notifyAdminsOfNewBooking(
    booking: Booking,
    service: Service,
    client: User,
    tenantId: string,
    triggeringUserId?: string,
  ) {
    try {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      const admins = await this.userRepository.find({
        where: { tenantId },
        relations: ['roles'],
      });

      const adminsToNotify = admins.filter(u =>
        u.roles.some(r => ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(r.name)) &&
        u.id !== triggeringUserId
      );

      for (const admin of adminsToNotify) {
        if (admin.email && tenant) {
          await this.jobsService.sendAdminNewBooking({
            email: admin.email,
            adminName: admin.firstName || 'Admin',
            clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
            serviceName: service.name,
            date: booking.startTime.toLocaleDateString('es-ES'),
            time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            tenantName: tenant.name,
          });
        }

        await this.notificationsService.create({
          userId: admin.id,
          tenantId,
          type: NotificationType.BOOKING_CREATED,
          title: 'Nueva Reserva',
          message: `El cliente ${client.firstName} ha reservado ${service.name} para el ${booking.startTime.toLocaleDateString('es-ES')}.`,
          metadata: { bookingId: booking.id, serviceId: service.id, role: 'admin' },
        });
      }
    } catch (error) {
      console.error('Error notifying admins of new booking:', error);
    }
  }

  private async notifyAdminsOfCancellation(
    booking: Booking,
    service: Service,
    client: User,
    tenantId: string,
    triggeringUserId?: string,
  ) {
    try {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      const admins = await this.userRepository.find({
        where: { tenantId },
        relations: ['roles'],
      });

      const adminsToNotify = admins.filter(u =>
        u.roles.some(r => ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(r.name)) &&
        u.id !== triggeringUserId
      );

      for (const admin of adminsToNotify) {
        if (admin.email && tenant) {
          await this.jobsService.sendAdminCancellation({
            email: admin.email,
            adminName: admin.firstName || 'Admin',
            clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
            serviceName: service.name,
            date: booking.startTime.toLocaleDateString('es-ES'),
            time: booking.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            tenantName: tenant.name,
          });
        }

        await this.notificationsService.create({
          userId: admin.id,
          tenantId,
          type: NotificationType.BOOKING_CANCELLED,
          title: 'Reserva Cancelada',
          message: `El cliente ${client.firstName} ha cancelado su reserva de ${service.name}.`,
          metadata: { bookingId: booking.id, serviceId: service.id, role: 'admin' },
        });
      }
    } catch (error) {
      console.error('Error notifying admins of cancellation:', error);
    }
  }
}
