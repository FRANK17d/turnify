import {
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsEnum,
} from 'class-validator';
import { TenantStatus } from '../entities/tenant.entity';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe ser un código hexadecimal válido',
  })
  primaryColor?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
