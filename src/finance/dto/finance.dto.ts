import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'UTILITIES' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 450000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Monthly electricity bill' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-09T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;
}

export class CreateIncomeDto {
  @ApiProperty({ example: 'OTHERS' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Sale of empty waste barrels' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-09T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;
}
