import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Nesco Oxygen Regulator' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'REG-NES-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({
    example: 'Medical grade regulator with humidifier bottle',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 350000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 210000 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  currentStock?: number = 0;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number = 5;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Nesco Oxygen Regulator' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'REG-NES-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    example: 'Medical grade regulator with humidifier bottle',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 210000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;
}
