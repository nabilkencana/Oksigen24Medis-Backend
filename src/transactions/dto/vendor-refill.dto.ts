import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class SendToVendorDto {
  @ApiProperty({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({ example: ['cyl-uuid-1', 'cyl-uuid-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  cylinderIds: string[];
}

export class ReceiveFromVendorDto {
  @ApiProperty({ example: ['cyl-uuid-1', 'cyl-uuid-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  cylinderIds: string[];

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  costPerCylinder: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number = 0;
}
