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
import { VendorsService } from '../services/vendors.service';
import { CreateVendorDto, UpdateVendorDto } from '../dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('inventory-vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create vendor' })
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated vendors' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.vendorsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update vendor' })
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete vendor' })
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}
