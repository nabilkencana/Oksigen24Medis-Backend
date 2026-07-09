import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FinanceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-07-31T23:59:59.999Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}
