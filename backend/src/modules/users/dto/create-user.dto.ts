import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
