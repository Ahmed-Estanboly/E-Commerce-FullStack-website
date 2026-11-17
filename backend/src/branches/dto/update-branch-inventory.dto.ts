import { IsInt, Min } from 'class-validator';

export class UpdateBranchInventoryDto {
  @IsInt()
  @Min(0)
  quantity: number;
}
