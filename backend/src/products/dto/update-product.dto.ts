import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto, BRANCHES } from './create-product.dto.js';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsString()
    @IsNotEmpty()
    title?: string;
    @IsNumber()
    @Min(0)
    price?: number;
    @IsString()
    @IsNotEmpty()
    description?: string;
    @IsInt()
    @Min(1)
    categoryId?: number;
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    images?: string[];
    @IsInt()
    @IsPositive()
    stock?: number;
    @IsIn(BRANCHES)
    branch?: string;
}
