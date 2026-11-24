import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const PAYMENT_METHODS = ['card', 'apple_pay', 'bancontact'] as const;

class OrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsString()
  branchName?: string;
}

class OrderBranchDto {
  @IsMongoId()
  branchId: string;
}

export class CreateOrderDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsEnum(['collect', 'deliver'])
  fulfilment: 'collect' | 'deliver';

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderBranchDto)
  branch?: OrderBranchDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderBranchDto)
  branches?: OrderBranchDto[];

  @ValidateIf((order: CreateOrderDto) => order.fulfilment === 'deliver')
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  cardLast4?: string;
}
