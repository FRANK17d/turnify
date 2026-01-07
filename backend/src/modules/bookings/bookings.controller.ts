import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { CheckPlanLimits } from '../subscriptions/decorators/subscription.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { Auditable } from '../audit/decorators/audit.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  // Admin: ver todas las reservas
  @Get()
  @RequirePermissions('MANAGE_BOOKINGS', 'VIEW_BOOKINGS')
  findAll(@CurrentUser() user: any) {
    if (user.permissions.includes('MANAGE_BOOKINGS')) {
      return this.bookingsService.findAll(user.tenantId);
    }
    return this.bookingsService.findMyBookings(user.userId, user.tenantId);
  }

  // Cliente: ver sus propias reservas
  @Get('my')
  @RequirePermissions('CREATE_BOOKING', 'VIEW_BOOKINGS')
  findMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.findMyBookings(user.userId, user.tenantId);
  }

  // Admin: ver reservas por rango de fechas
  @Get('date-range')
  @RequirePermissions('MANAGE_BOOKINGS', 'VIEW_BOOKINGS')
  findByDateRange(
    @Query('start') start: string,
    @Query('end') end: string,
    @CurrentUser() user: any,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return this.bookingsService.findByDateRange(user.tenantId, startDate, endDate);
  }

  @Get(':id')
  @RequirePermissions('CREATE_BOOKING', 'VIEW_BOOKINGS', 'MANAGE_BOOKINGS')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.permissions.includes('MANAGE_BOOKINGS');
    return this.bookingsService.findOne(id, user.tenantId, user.userId, isAdmin);
  }

  // Crear reserva (cliente o admin)
  @Post()
  @UseGuards(SubscriptionGuard)
  @CheckPlanLimits('bookings')
  @Auditable('booking')
  @RequirePermissions('CREATE_BOOKING', 'MANAGE_BOOKINGS')
  create(@Body() createBookingDto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(createBookingDto, user.userId, user.tenantId);
  }

  // Actualizar reserva
  @Put(':id')
  @Auditable('booking')
  @RequirePermissions('CREATE_BOOKING', 'MANAGE_BOOKINGS')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.permissions.includes('MANAGE_BOOKINGS');
    return this.bookingsService.update(id, updateBookingDto, user.tenantId, user.userId, isAdmin);
  }

  // Cancelar reserva
  @Put(':id/cancel')
  @Auditable('booking', 'UPDATE')
  @RequirePermissions('CREATE_BOOKING', 'MANAGE_BOOKINGS')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.permissions.includes('MANAGE_BOOKINGS');
    return this.bookingsService.cancel(id, user.tenantId, user.userId, isAdmin);
  }

  // Eliminar reserva (solo admin)
  @Delete(':id')
  @Auditable('booking')
  @RequirePermissions('MANAGE_BOOKINGS')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.remove(id, user.tenantId, user.userId);
  }
}
