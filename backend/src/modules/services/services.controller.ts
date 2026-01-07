import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { CheckPlanLimits } from '../subscriptions/decorators/subscription.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { Auditable } from '../audit/decorators/audit.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  // Endpoint público para clientes - ver servicios activos
  @Get('public')
  @Public()
  findAllPublic(@CurrentUser() user: any) {
    // Este endpoint necesita el tenant de otra manera (query param o subdomain)
    // Por ahora requiere auth
    return this.servicesService.findAllActive(user?.tenantId);
  }

  @Get()
  @RequirePermissions('MANAGE_SERVICES', 'VIEW_SERVICES')
  findAll(@CurrentUser() user: any) {
    return this.servicesService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('MANAGE_SERVICES', 'VIEW_SERVICES', 'CREATE_BOOKING')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.findOne(id, user.tenantId);
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  @CheckPlanLimits('services')
  @Auditable('service')
  @RequirePermissions('MANAGE_SERVICES')
  create(@Body() createServiceDto: CreateServiceDto, @CurrentUser() user: any) {
    return this.servicesService.create(createServiceDto, user.tenantId, user.userId);
  }

  @Put(':id')
  @Auditable('service')
  @RequirePermissions('MANAGE_SERVICES')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.servicesService.update(id, updateServiceDto, user.tenantId, user.userId);
  }

  @Delete(':id')
  @Auditable('service')
  @RequirePermissions('MANAGE_SERVICES')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.remove(id, user.tenantId, user.userId);
  }
}
