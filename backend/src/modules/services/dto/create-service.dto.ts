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

export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number; // en minutos

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
