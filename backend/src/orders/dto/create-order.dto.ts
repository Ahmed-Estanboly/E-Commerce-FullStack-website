
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
  
  class OrderItemDto {
    @IsMongoId()
    productId: string;
  
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @IsNumber()
    @Min(0)
    price: number;
  
    @IsNumber()
    @Min(1)
    quantity: number;
  }
  
  class OrderBranchDto {
    @IsNumber()
    id: number;
  
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsNotEmpty()
    city: string;
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
  
    @IsNumber()
    @Min(0)
    subtotal: number;
  
    @IsNumber()
    @Min(0)
    shippingFee: number;
  
    @IsNumber()
    @Min(0)
    total: number;
  
    @IsEnum(['collect', 'deliver'])
    fulfilment: 'collect' | 'deliver';
  
    @ValidateNested()
    @Type(() => OrderBranchDto)
    branch: OrderBranchDto;
  
    @IsOptional()
    @IsString()
    deliveryAddress?: string;
  
    @IsEnum(['card', 'apple_pay', 'bancontact'])
    paymentMethod: 'card' | 'apple_pay' | 'bancontact';
  
    @IsOptional()
    @IsString()
    cardLast4?: string;
  }