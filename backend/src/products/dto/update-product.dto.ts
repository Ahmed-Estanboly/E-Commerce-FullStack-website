import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsString()
    title?: string;
    @IsNumber()
    price?: number;
    @IsString()
    description?: string;
    @IsNumber()
    categoryId?: number;
    @IsArray()
    images?: [string];   
}
