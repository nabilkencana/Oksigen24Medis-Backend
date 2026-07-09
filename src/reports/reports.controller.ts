import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get revenue report details', description: 'Returns timeline and category aggregates for incomes.' })
  @ApiResponse({ status: 200, description: 'Revenue report generated.' })
  getRevenueReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getRevenueReport(query);
  }

  @Get('rentals')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get cylinder rental report', description: 'Lease lists and stats.' })
  getRentalReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getRentalReport(query);
  }

  @Get('inventory')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get current inventory valuation and stock levels' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('expenses')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get expense timeline and category totals' })
  getExpenseReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getExpenseReport(query);
  }
}
