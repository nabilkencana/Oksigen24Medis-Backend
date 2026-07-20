import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { TransactionsService } from './transactions.service';
import { CreateRentalDto, ReturnRentalDto } from './dto/rental.dto';
import { SendToVendorDto, ReceiveFromVendorDto } from './dto/vendor-refill.dto';
import { CreateSaleDto } from './dto/sale.dto';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { CreateCustomerRefillDto } from './dto/customer-refill.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('rentals')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create new cylinder rental' })
  @ApiResponse({
    status: 201,
    description: 'Rental invoice created successfully.',
  })
  createRental(
    @Body() dto: CreateRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.createRental(dto, userId);
  }

  @Post('rentals/:id/return')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Process cylinder return for a rental' })
  returnRental(
    @Param('id') id: string,
    @Body() dto: ReturnRentalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.returnRental(id, dto, userId);
  }

  @Post('refills/send')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Send empty cylinders to a vendor for refill' })
  sendToVendor(
    @Body() dto: SendToVendorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.sendToVendor(dto, userId);
  }

  @Post('refills/receive')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Receive filled cylinders back from a vendor' })
  receiveFromVendor(
    @Body() dto: ReceiveFromVendorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.receiveFromVendor(dto, userId);
  }

  @Post('sales')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Process a retail sale (accessories & products)' })
  createSale(@Body() dto: CreateSaleDto, @CurrentUser('id') userId: string) {
    return this.transactionsService.createSale(dto, userId);
  }

  @Post('refills/customer')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create new customer cylinder refill transaction' })
  createCustomerRefill(
    @Body() dto: CreateCustomerRefillDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.createCustomerRefill(dto, userId);
  }

  @Post('purchases')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({
    summary: 'Process a supplier purchase (restocking products)',
  })
  createPurchase(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.createPurchase(dto, userId);
  }

  @Get('rentals')
  @ApiOperation({ summary: 'Get paginated rentals list' })
  findAllRentals(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAllRentals(paginationDto);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get paginated sales list' })
  findAllSales(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAllSales(paginationDto);
  }

  @Get('refills/customer')
  @ApiOperation({ summary: 'Get paginated customer refills list' })
  findAllCustomerRefills(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAllCustomerRefills(paginationDto);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Get paginated purchases list' })
  findAllPurchases(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAllPurchases(paginationDto);
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Get paginated stock movement history' })
  findAllStockMovements(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAllStockMovements(paginationDto);
  }

  // ── DELETE ENDPOINTS ─────────────────────────────────────────────────────────

  @Delete('refills/customer/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a customer refill transaction' })
  @ApiResponse({ status: 200, description: 'Customer refill deleted (soft).' })
  deleteCustomerRefill(@Param('id') id: string) {
    return this.transactionsService.deleteCustomerRefill(id);
  }

  @Delete('sales/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a sale transaction' })
  @ApiResponse({ status: 200, description: 'Sale deleted (soft).' })
  deleteSale(@Param('id') id: string) {
    return this.transactionsService.deleteSale(id);
  }

  @Delete('rentals/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a rental transaction' })
  @ApiResponse({ status: 200, description: 'Rental deleted (soft).' })
  deleteRental(@Param('id') id: string) {
    return this.transactionsService.deleteRental(id);
  }

  // ── SYNC / REPAIR ─────────────────────────────────────────────────────────

  @Post('sync/rental-cylinders')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync cylinder statuses for all active rentals (repair utility)' })
  syncRentalCylinderStatus() {
    return this.transactionsService.syncRentalCylinderStatus();
  }
}
