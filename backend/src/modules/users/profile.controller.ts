import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateNotificationPreferencesDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { Auditable } from '../audit/decorators/audit.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: any) {
    return this.profileService.getProfile(user.userId);
  }

  @Put()
  @Auditable('profile')
  updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: any,
  ) {
    return this.profileService.updateProfile(user.userId, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Auditable('profile')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.profileService.changePassword(user.userId, changePasswordDto);
  }

  @Get('notification-preferences')
  getNotificationPreferences(@CurrentUser() user: any) {
    return this.profileService.getNotificationPreferences(user.userId);
  }

  @Put('notification-preferences')
  @Auditable('profile')
  updateNotificationPreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @CurrentUser() user: any,
  ) {
    return this.profileService.updateNotificationPreferences(user.userId, dto);
  }
}
