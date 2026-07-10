import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateOxygenTypeDto {
  @ApiProperty({ example: 'Medical Oxygen 99.5%' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 99.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  purity: number;

  @ApiPropertyOptional({ example: 150.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pressure?: number;

  @ApiPropertyOptional({ example: 'High purity medical grade oxygen' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}

export class UpdateOxygenTypeDto {
  @ApiPropertyOptional({ example: 'Medical Oxygen 99.5%' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 99.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  purity?: number;

  @ApiPropertyOptional({ example: 150.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pressure?: number;

  @ApiPropertyOptional({ example: 'High purity medical grade oxygen' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 75000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;
}
