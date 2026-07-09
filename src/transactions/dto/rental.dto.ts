import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRentalDto {
  @ApiProperty({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: '2026-08-09T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dueDate: Date;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number = 0;

  @ApiPropertyOptional({ example: 'Regular customer rental' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: ['cyl-uuid-1', 'cyl-uuid-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  cylinderIds: string[];
}

export class ReturnRentalDto {
  @ApiProperty({ example: ['cyl-uuid-1'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  cylinderIds: string[];
}
