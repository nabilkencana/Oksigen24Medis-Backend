import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'company_name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Oksigen 24 Medis' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
