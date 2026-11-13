import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto.js';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsString()
    @IsNotEmpty()
    name?: string;
    @IsString()
    @IsNotEmpty()
    @IsUrl()
    image?: string;
}
