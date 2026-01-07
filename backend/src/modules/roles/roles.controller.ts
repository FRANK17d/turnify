import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @RequirePermissions('MANAGE_ROLES', 'MANAGE_USERS')
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Get('permissions')
  @RequirePermissions('MANAGE_ROLES', 'MANAGE_USERS')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('MANAGE_ROLES', 'MANAGE_USERS')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.findOne(id, user.tenantId);
  }

  @Post()
  @RequirePermissions('MANAGE_ROLES')
  create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: any) {
    return this.rolesService.create(createRoleDto, user.tenantId, user.userId);
  }

  @Put(':id')
  @RequirePermissions('MANAGE_ROLES')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.update(id, updateRoleDto, user.tenantId, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('MANAGE_ROLES')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.remove(id, user.tenantId, user.userId);
  }
}
