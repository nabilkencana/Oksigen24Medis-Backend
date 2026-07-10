import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseItemDto {
  @ApiProperty({ example: 'prod-uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 210000 })
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 'vendor-uuid' })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number = 0;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
