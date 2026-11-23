import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/)
  code: string;

  @IsIn(['percent', 'fixed'])
  kind: 'percent' | 'fixed';

  @IsNumber()
  @Min(0.01)
  @Max(100000)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSubtotal?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  usageLimit?: number;
}
