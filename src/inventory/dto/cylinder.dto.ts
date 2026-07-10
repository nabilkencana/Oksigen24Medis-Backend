import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CylinderStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCylinderDto {
  @ApiProperty({ example: 'CYL-MED-001' })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ example: 40.0 })
  @IsNumber()
  @Min(0)
  capacity: number;

  @ApiProperty({ example: '6m3' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiPropertyOptional({
    enum: CylinderStatus,
    default: CylinderStatus.AVAILABLE,
  })
  @IsEnum(CylinderStatus)
  @IsOptional()
  status?: CylinderStatus = CylinderStatus.AVAILABLE;

  @ApiProperty({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsNotEmpty()
  oxygenTypeId: string;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  vendorId?: string;
}

export class UpdateCylinderDto {
  @ApiPropertyOptional({ example: 'CYL-MED-001' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 40.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: '6m3' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ enum: CylinderStatus })
  @IsEnum(CylinderStatus)
  @IsOptional()
  status?: CylinderStatus;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  oxygenTypeId?: string;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' })
  @IsUUID()
  @IsOptional()
  vendorId?: string;
}
