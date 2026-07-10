import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateExpenseDto, CreateIncomeDto } from './dto/finance.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense entry' })
  createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createExpense(dto, userId);
  }

  @Post('incomes')
  @ApiOperation({ summary: 'Create a new manual income entry' })
  createIncome(
    @Body() dto: CreateIncomeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createIncome(dto, userId);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get list of paginated expenses' })
  findAllExpenses(@Query() query: FinanceQueryDto) {
    return this.financeService.findAllExpenses(query);
  }

  @Get('incomes')
  @ApiOperation({ summary: 'Get list of paginated incomes' })
  findAllIncomes(@Query() query: FinanceQueryDto) {
    return this.financeService.findAllIncomes(query);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow summaries' })
  getCashFlow(@Query() query: FinanceQueryDto) {
    return this.financeService.getCashFlowSummary(query);
  }
}
