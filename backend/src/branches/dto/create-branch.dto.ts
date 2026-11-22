import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(8)
  ownerPassword: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  workingHours?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
