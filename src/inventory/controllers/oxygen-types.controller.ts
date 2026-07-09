import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OxygenTypesService } from '../services/oxygen-types.service';
import { CreateOxygenTypeDto, UpdateOxygenTypeDto } from '../dto/oxygen-type.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('inventory-oxygen-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/oxygen-types')
export class OxygenTypesController {
  constructor(private readonly oxygenTypesService: OxygenTypesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create oxygen type' })
  create(@Body() dto: CreateOxygenTypeDto) {
    return this.oxygenTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated oxygen types' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.oxygenTypesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get oxygen type by ID' })
  findOne(@Param('id') id: string) {
    return this.oxygenTypesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update oxygen type' })
  update(@Param('id') id: string, @Body() dto: UpdateOxygenTypeDto) {
    return this.oxygenTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete oxygen type' })
  remove(@Param('id') id: string) {
    return this.oxygenTypesService.remove(id);
  }
}
