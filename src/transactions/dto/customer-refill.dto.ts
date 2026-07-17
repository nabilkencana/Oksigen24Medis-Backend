import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CustomerRefillItemDto {
  @ApiProperty({ example: '1m3' })
  @IsString()
  @IsNotEmpty()
  cylinderSize: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateCustomerRefillDto {
  @ApiPropertyOptional({ example: 'cust-uuid' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number = 0;

  @ApiPropertyOptional({ example: 'TUNAI' })
  @IsString()
  @IsOptional()
  paymentMethod?: string = 'TUNAI';

  @ApiPropertyOptional({ example: 'Catatan isi ulang' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CustomerRefillItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CustomerRefillItemDto)
  items: CustomerRefillItemDto[];
}
