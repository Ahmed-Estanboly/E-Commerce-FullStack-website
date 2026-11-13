import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

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

}
