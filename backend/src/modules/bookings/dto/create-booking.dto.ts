import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
