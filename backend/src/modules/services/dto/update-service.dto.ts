import {
  IsString,
  MinLength,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
