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
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { TenantStatus } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditInterceptor, Auditable } from '../audit';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  // Super Admin: ver todas las empresas
  @Get()
  @RequirePermissions('SUPER_ADMIN')
  findAll() {
    return this.tenantsService.findAll();
  }

  // Obtener mi empresa (filtrado por seguridad)
  @Get('me')
  async getMyTenant(@CurrentUser() user: any) {
    const tenant = await this.tenantsService.getMyTenant(user.tenantId);

    // Verificar si tiene permisos de administración para ver datos sensibles
    const hasAdminAccess = user.roles?.includes('SUPER_ADMIN') ||
      user.permissions?.includes('MANAGE_BRANDING');

    if (hasAdminAccess) {
      return tenant;
    }

    // Para usuarios normales, devolver solo info pública de branding
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      timezone: tenant.timezone,
    };
  }

  // Super Admin: ver empresa por ID
  @Get(':id')
  @RequirePermissions('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  // Super Admin: crear empresa
  @Post()
  @RequirePermissions('SUPER_ADMIN')
  @Auditable('tenant', 'CREATE')
  create(@Body() createTenantDto: CreateTenantDto, @CurrentUser() user: any) {
    return this.tenantsService.create(createTenantDto, user.userId);
  }

  // Admin puede actualizar branding de su empresa
  @Put('me')
  @RequirePermissions('MANAGE_BRANDING')
  @Auditable('tenant', 'UPDATE_BRANDING')
  updateMyTenant(@Body() updateTenantDto: UpdateTenantDto, @CurrentUser() user: any) {
    // Solo permitir ciertos campos para admin de empresa
    const allowedFields: UpdateTenantDto = {
      name: updateTenantDto.name,
      logo: updateTenantDto.logo,
      primaryColor: updateTenantDto.primaryColor,
      timezone: updateTenantDto.timezone,
    };
    return this.tenantsService.update(user.tenantId, allowedFields, user.userId);
  }

  // Super Admin: actualizar cualquier empresa
  @Put(':id')
  @RequirePermissions('SUPER_ADMIN')
  @Auditable('tenant', 'UPDATE')
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: any,
  ) {
    return this.tenantsService.update(id, updateTenantDto, user.userId);
  }

  // Super Admin: cambiar estado de empresa
  @Put(':id/status')
  @RequirePermissions('SUPER_ADMIN')
  @Auditable('tenant', 'UPDATE_STATUS')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
    @CurrentUser() user: any,
  ) {
    return this.tenantsService.updateStatus(id, status, user.userId);
  }

  // Admin puede actualizar configuración de su empresa
  @Put('me/settings')
  @RequirePermissions('MANAGE_BRANDING')
  @Auditable('tenant', 'UPDATE_SETTINGS')
  updateMyTenantSettings(
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: any,
  ) {
    const allowedFields: UpdateTenantDto = {
      name: updateTenantDto.name,
      logo: updateTenantDto.logo,
      primaryColor: updateTenantDto.primaryColor,
      timezone: updateTenantDto.timezone,
    };
    return this.tenantsService.update(user.tenantId, allowedFields, user.userId);
  }

  // Super Admin: eliminar empresa
  @Delete(':id')
  @RequirePermissions('SUPER_ADMIN')
  @Auditable('tenant', 'DELETE')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tenantsService.remove(id, user.userId);
  }
}
