import { OmitType } from '@nestjs/mapped-types';
import { IsInt, Min } from 'class-validator';
import { CreateProductDto } from '../../products/dto/create-product.dto.js';

export class CreateBranchProductDto extends OmitType(CreateProductDto, ['branch', 'stock'] as const) {
  @IsInt()
  @Min(0)
  branchQuantity: number;
}
