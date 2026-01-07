import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { CheckPlanLimits } from '../subscriptions/decorators/subscription.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { Auditable } from '../audit/decorators/audit.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermissions('MANAGE_USERS', 'VIEW_USERS')
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('MANAGE_USERS', 'VIEW_USERS')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.tenantId);
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  @CheckPlanLimits('users')
  @Auditable('user')
  @RequirePermissions('MANAGE_USERS')
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(createUserDto, user.tenantId, user.userId);
  }

  @Patch(':id')
  @Auditable('user')
  @RequirePermissions('MANAGE_USERS')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user.tenantId, user.userId);
  }

  @Delete(':id')
  @Auditable('user')
  @RequirePermissions('MANAGE_USERS')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.tenantId, user.userId);
  }
}
