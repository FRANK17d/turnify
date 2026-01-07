import {
  IsString,
  MinLength,
  IsOptional,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe ser un código hexadecimal válido (ej: #FF5733)',
  })
  primaryColor?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
