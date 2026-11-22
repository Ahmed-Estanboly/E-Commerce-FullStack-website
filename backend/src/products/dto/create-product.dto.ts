import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export const BRANCHES = ['north', 'center', 'south'] as const;

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    title: string;
    @IsNumber()
    @Min(0)
    price: number;
    @IsString()
    @IsNotEmpty()
    description: string;
    @IsInt()
    @Min(1)
    categoryId: number;
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    images: string[];
    @IsInt()
    @IsPositive()
    stock: number;
    @IsOptional()
    @IsIn(BRANCHES)
    branch?: string;
}
