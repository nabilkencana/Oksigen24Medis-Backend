import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CylindersService } from '../services/cylinders.service';
import { CreateCylinderDto, UpdateCylinderDto } from '../dto/cylinder.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('inventory-cylinders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/cylinders')
export class CylindersController {
  constructor(private readonly cylindersService: CylindersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create cylinder asset' })
  create(@Body() dto: CreateCylinderDto) {
    return this.cylindersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated cylinder assets' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.cylindersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cylinder by ID' })
  findOne(@Param('id') id: string) {
    return this.cylindersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update cylinder details' })
  update(@Param('id') id: string, @Body() dto: UpdateCylinderDto) {
    return this.cylindersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete cylinder asset' })
  remove(@Param('id') id: string) {
    return this.cylindersService.remove(id);
  }
}
