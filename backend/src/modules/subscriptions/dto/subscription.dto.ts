import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class ChangePlanDto {
  @IsUUID()
  planId: string;
}
