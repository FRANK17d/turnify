import {
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
