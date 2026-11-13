import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
        @IsEmail()
        email: string;
    
        @IsString()
        @IsOptional()
        @IsNotEmpty()
        name?: string;
    
        @IsString()
        @MinLength(6)
        password: string;
    
        @IsString()
        @IsOptional()
        @IsNotEmpty()
        role?: string;
    
        @IsString()
        @IsOptional()
        avatar?: string;
}
