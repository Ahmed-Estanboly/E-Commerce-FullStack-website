import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto.js';
import { IsString } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsString()
    name?: string;
    @IsString()
    image?: string;
}
