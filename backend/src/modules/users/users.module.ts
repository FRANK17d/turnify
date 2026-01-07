import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, AuditLog, RefreshToken, Subscription])],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService],
})
export class UsersModule { }

