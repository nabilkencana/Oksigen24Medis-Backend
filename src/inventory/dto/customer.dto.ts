import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '0811223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'budi@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Jl. Melati No. 5, Jakarta' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  balance?: number;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '0811223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'budi@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Jl. Melati No. 5, Jakarta' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
