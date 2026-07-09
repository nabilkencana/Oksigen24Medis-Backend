import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: 'PT Samator Gas Industri' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '0215551234' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'sales@samator.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Kawasan Industri Pulo Gadung, Jakarta' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 'PT Samator Gas Industri' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '0215551234' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'sales@samator.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Kawasan Industri Pulo Gadung, Jakarta' })
  @IsString()
  @IsOptional()
  address?: string;
}
