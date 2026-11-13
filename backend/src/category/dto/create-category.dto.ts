import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsString()
    @IsNotEmpty()
    @IsUrl()
    image: string;
}
