import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get dashboard statistics summary',
    description:
      'Returns revenue KPIs, active rentals count, stock warnings, recent movements, and 30-day chart data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully.',
  })
  getSummary() {
    return this.dashboardService.getDashboardSummary();
  }
}
