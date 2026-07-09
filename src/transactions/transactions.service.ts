import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRentalDto, ReturnRentalDto } from './dto/rental.dto';
import { SendToVendorDto, ReceiveFromVendorDto } from './dto/vendor-refill.dto';
import { CreateSaleDto } from './dto/sale.dto';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CylinderStatus, MovementType, MovementReferenceType, PaymentStatus } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // RENTAL WORKFLOW
  // ==========================================
  async createRental(dto: CreateRentalDto, userId: string) {
    const amountPaid = dto.amountPaid ?? 0;
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Customer
      const customer = await tx.customer.findFirst({
        where: { id: dto.customerId, deletedAt: null },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      // 2. Validate Cylinders are AVAILABLE
      const cylinders = await tx.cylinder.findMany({
        where: {
          id: { in: dto.cylinderIds },
          deletedAt: null,
        },
        include: { oxygenType: true },
      });

      if (cylinders.length !== dto.cylinderIds.length) {
        throw new BadRequestException('Some cylinders could not be found');
      }

      for (const cyl of cylinders) {
        if (cyl.status !== CylinderStatus.AVAILABLE) {
          throw new BadRequestException(`Cylinder ${cyl.serialNumber} is not AVAILABLE (Current status: ${cyl.status})`);
        }
      }

      // 3. Generate Invoice Number (e.g. RNT-YYYYMMDD-XXXX)
      const count = await tx.rental.count();
      const invoiceNo = `RNT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      // 4. Calculate totalAmount (based on oxygen types price per unit)
      let totalAmount = 0;
      const rentalItemsData = cylinders.map((cyl) => {
        const price = Number(cyl.oxygenType.pricePerUnit);
        totalAmount += price;
        return {
          cylinderId: cyl.id,
          price,
        };
      });

      // 5. Create Rental Record
      const rental = await tx.rental.create({
        data: {
          invoiceNo,
          customerId: dto.customerId,
          dueDate: dto.dueDate,
          totalAmount,
          amountPaid,
          status: 'RENTING',
          notes: dto.notes,
          createdById: userId,
          items: {
            create: rentalItemsData,
          },
        },
      });

      // 6. Update Cylinders Status -> RENTED and Customer association
      for (const cyl of cylinders) {
        await tx.cylinder.update({
          where: { id: cyl.id },
          data: {
            status: CylinderStatus.RENTED,
            customerId: dto.customerId,
          },
        });

        // 7. Log StockMovement (OUT)
        await tx.stockMovement.create({
          data: {
            type: MovementType.OUT,
            referenceType: MovementReferenceType.RENTAL,
            referenceId: rental.id,
            cylinderId: cyl.id,
            quantity: 1,
            beforeStock: 1, // Available in warehouse before
            afterStock: 0,  // Checked out now
            createdById: userId,
          },
        });
      }

      // 8. Log Income if amountPaid > 0
      if (amountPaid > 0) {
        await tx.income.create({
          data: {
            category: 'RENTAL_REVENUE',
            amount: amountPaid,
            description: `Pembayaran invoice sewa ${invoiceNo}`,
            createdById: userId,
            referenceType: MovementReferenceType.RENTAL,
            referenceId: rental.id,
          },
        });

        // Update customer balance if they paid more or less than totalAmount
        const diff = Number(rental.totalAmount) - amountPaid;
        if (diff > 0) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { balance: { increment: diff } }, // Customer owes debt
          });
        }
      } else {
        // Customer paid 0, so increase their debt balance
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { balance: { increment: totalAmount } },
        });
      }

      return rental;
    });
  }

  // ==========================================
  // RETURN WORKFLOW
  // ==========================================
  async returnRental(rentalId: string, dto: ReturnRentalDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Rental
      const rental = await tx.rental.findUnique({
        where: { id: rentalId },
        include: { items: true },
      });
      if (!rental) throw new NotFoundException('Rental not found');

      // 2. Validate returned cylinders are part of this rental
      const rentalCylinderIds = rental.items.map(item => item.cylinderId);
      for (const returnedId of dto.cylinderIds) {
        if (!rentalCylinderIds.includes(returnedId)) {
          throw new BadRequestException(`Cylinder ${returnedId} is not part of this rental`);
        }
      }

      // 3. Mark RentalItems returned status & Cylinder Status -> EMPTY
      for (const cylId of dto.cylinderIds) {
        await tx.rentalItem.updateMany({
          where: { rentalId, cylinderId: cylId, returnedAt: null },
          data: { returnedAt: new Date() },
        });

        await tx.cylinder.update({
          where: { id: cylId },
          data: {
            status: CylinderStatus.EMPTY,
            customerId: null, // Clear customer link since returned
          },
        });

        // 4. Log StockMovement (IN - Returned as empty cylinder)
        await tx.stockMovement.create({
          data: {
            type: MovementType.IN,
            referenceType: MovementReferenceType.RETURN,
            referenceId: rentalId,
            cylinderId: cylId,
            quantity: 1,
            beforeStock: 0,
            afterStock: 1, // Cylinder is physically back in warehouse
            createdById: userId,
          },
        });
      }

      // Check if all items in this rental have been returned
      const openItemsCount = await tx.rentalItem.count({
        where: { rentalId, returnedAt: null },
      });

      let updatedRentalStatus = 'RENTING';
      if (openItemsCount === 0) {
        updatedRentalStatus = 'RETURNED';
        await tx.rental.update({
          where: { id: rentalId },
          data: {
            status: 'RETURNED',
            returnDate: new Date(),
          },
        });
      }

      return { message: 'Cylinders returned successfully', status: updatedRentalStatus };
    });
  }

  // ==========================================
  // VENDOR REFILL WORKFLOW
  // ==========================================
  async sendToVendor(dto: SendToVendorDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Validate Vendor
      const vendor = await tx.vendor.findFirst({
        where: { id: dto.vendorId, deletedAt: null },
      });
      if (!vendor) throw new NotFoundException('Vendor not found');

      // Validate Cylinders are EMPTY
      const cylinders = await tx.cylinder.findMany({
        where: { id: { in: dto.cylinderIds }, deletedAt: null },
      });

      if (cylinders.length !== dto.cylinderIds.length) {
        throw new BadRequestException('Some cylinders not found');
      }

      for (const cyl of cylinders) {
        if (cyl.status !== CylinderStatus.EMPTY) {
          throw new BadRequestException(`Cylinder ${cyl.serialNumber} is not EMPTY (Current status: ${cyl.status})`);
        }
      }

      // Update Cylinders to AT_VENDOR
      for (const cyl of cylinders) {
        await tx.cylinder.update({
          where: { id: cyl.id },
          data: {
            status: CylinderStatus.AT_VENDOR,
            vendorId: dto.vendorId,
          },
        });

        // Log StockMovement (OUT)
        await tx.stockMovement.create({
          data: {
            type: MovementType.OUT,
            referenceType: MovementReferenceType.VENDOR_REFILL,
            referenceId: dto.vendorId,
            cylinderId: cyl.id,
            quantity: 1,
            beforeStock: 1,
            afterStock: 0, // physically left the store
            createdById: userId,
          },
        });
      }

      return { message: 'Cylinders sent to vendor successfully' };
    });
  }

  async receiveFromVendor(dto: ReceiveFromVendorDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Validate Cylinders are AT_VENDOR
      const cylinders = await tx.cylinder.findMany({
        where: { id: { in: dto.cylinderIds }, deletedAt: null },
      });

      if (cylinders.length !== dto.cylinderIds.length) {
        throw new BadRequestException('Some cylinders not found');
      }

      for (const cyl of cylinders) {
        if (cyl.status !== CylinderStatus.AT_VENDOR) {
          throw new BadRequestException(`Cylinder ${cyl.serialNumber} is not at vendor (Current status: ${cyl.status})`);
        }
      }

      // Update Cylinders to AVAILABLE
      for (const cyl of cylinders) {
        await tx.cylinder.update({
          where: { id: cyl.id },
          data: {
            status: CylinderStatus.AVAILABLE,
            vendorId: null, // Disconnect vendor
          },
        });

        // Log StockMovement (IN)
        await tx.stockMovement.create({
          data: {
            type: MovementType.IN,
            referenceType: MovementReferenceType.VENDOR_REFILL,
            referenceId: cyl.id, // Reference to cylinder itself or transaction
            cylinderId: cyl.id,
            quantity: 1,
            beforeStock: 0,
            afterStock: 1, // back in warehouse
            createdById: userId,
          },
        });
      }

      // Log refill expenses
      const totalCost = dto.costPerCylinder * dto.cylinderIds.length;
      if (totalCost > 0) {
        await tx.expense.create({
          data: {
            category: 'VENDOR_REFILL',
            amount: totalCost,
            description: `Refill cost for ${dto.cylinderIds.length} cylinders from vendor`,
            createdById: userId,
          },
        });
      }

      return { message: 'Cylinders received and available in warehouse' };
    });
  }

  // ==========================================
  // SALES WORKFLOW
  // ==========================================
  async createSale(dto: CreateSaleDto, userId: string) {
    const amountPaid = dto.amountPaid ?? 0;
    return this.prisma.$transaction(async (tx) => {
      if (dto.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: dto.customerId, deletedAt: null },
        });
        if (!customer) throw new NotFoundException('Customer not found');
      }

      // Fetch all products
      const productIds = dto.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products not found');
      }

      const productMap = new Map(products.map(p => [p.id, p]));
      let totalAmount = 0;

      // 1. Validate Product stocks (cannot become negative!)
      const saleItemsData = dto.items.map((item) => {
        const prod = productMap.get(item.productId);
        if (!prod) throw new NotFoundException(`Product ${item.productId} not mapped`);

        if (prod.currentStock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${prod.name} (Available: ${prod.currentStock}, Requested: ${item.quantity})`);
        }

        const price = Number(prod.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: price,
          subtotal,
        };
      });

      // 2. Generate Invoice No (e.g. SAL-YYYYMMDD-XXXX)
      const count = await tx.sale.count();
      const invoiceNo = `SAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      // 3. Determine Payment Status (Explicit type)
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      if (amountPaid === 0) {
        paymentStatus = PaymentStatus.UNPAID;
      } else if (amountPaid < totalAmount) {
        paymentStatus = PaymentStatus.PARTIAL;
      }

      // 4. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: dto.customerId || null,
          totalAmount,
          amountPaid,
          paymentMethod: dto.paymentMethod,
          status: paymentStatus,
          createdById: userId,
          items: {
            create: saleItemsData,
          },
        },
      });

      // 5. Update stock and Log StockMovement for each product
      for (const item of dto.items) {
        const prod = productMap.get(item.productId);
        if (!prod) throw new NotFoundException('Product mapping lost');
        const beforeStock = prod.currentStock;
        const afterStock = beforeStock - item.quantity;

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: afterStock },
        });

        // Create OUT stock movement
        await tx.stockMovement.create({
          data: {
            type: MovementType.OUT,
            referenceType: MovementReferenceType.SALE,
            referenceId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            beforeStock,
            afterStock,
            createdById: userId,
          },
        });
      }

      // 6. Log Income if amountPaid > 0
      if (amountPaid > 0) {
        await tx.income.create({
          data: {
            category: 'SALES_REVENUE',
            amount: amountPaid,
            description: `Pembayaran invoice penjualan ${invoiceNo}`,
            createdById: userId,
            referenceType: MovementReferenceType.SALE,
            referenceId: sale.id,
          },
        });
      }

      // Update customer balance debt if payment is partial/unpaid
      if (dto.customerId && amountPaid < totalAmount) {
        const debt = totalAmount - amountPaid;
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { balance: { increment: debt } },
        });
      }

      return sale;
    });
  }

  // ==========================================
  // PURCHASE WORKFLOW (RESTOCK)
  // ==========================================
  async createPurchase(dto: CreatePurchaseDto, userId: string) {
    const amountPaid = dto.amountPaid ?? 0;
    return this.prisma.$transaction(async (tx) => {
      // Validate Vendor
      const vendor = await tx.vendor.findFirst({
        where: { id: dto.vendorId, deletedAt: null },
      });
      if (!vendor) throw new NotFoundException('Vendor not found');

      // Fetch all products
      const productIds = dto.items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products not found');
      }

      const productMap = new Map(products.map(p => [p.id, p]));
      let totalAmount = 0;

      const purchaseItemsData = dto.items.map((item) => {
        const prod = productMap.get(item.productId);
        if (!prod) throw new NotFoundException(`Product ${item.productId} not mapped`);

        const subtotal = item.unitCost * item.quantity;
        totalAmount += subtotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal,
        };
      });

      // Generate invoice
      const count = await tx.purchase.count();
      const invoiceNo = `PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      // Determine Payment Status (Explicit type)
      let paymentStatus: PaymentStatus = PaymentStatus.PAID;
      if (amountPaid === 0) {
        paymentStatus = PaymentStatus.UNPAID;
      } else if (amountPaid < totalAmount) {
        paymentStatus = PaymentStatus.PARTIAL;
      }

      // Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          invoiceNo,
          vendorId: dto.vendorId,
          totalAmount,
          amountPaid,
          status: paymentStatus,
          createdById: userId,
          items: {
            create: purchaseItemsData,
          },
        },
      });

      // Update Stock and Log StockMovement (IN) for each item
      for (const item of dto.items) {
        const prod = productMap.get(item.productId);
        if (!prod) throw new NotFoundException('Product mapping lost');
        const beforeStock = prod.currentStock;
        const afterStock = beforeStock + item.quantity;

        // Increase stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: afterStock },
        });

        // Create StockMovement IN log
        await tx.stockMovement.create({
          data: {
            type: MovementType.IN,
            referenceType: MovementReferenceType.PURCHASE,
            referenceId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            beforeStock,
            afterStock,
            createdById: userId,
          },
        });
      }

      // Log Expense
      if (amountPaid > 0) {
        await tx.expense.create({
          data: {
            category: 'PURCHASE',
            amount: amountPaid,
            description: `Purchase of inventory restock under invoice ${invoiceNo}`,
            createdById: userId,
          },
        });
      }

      return purchase;
    });
  }

  // ==========================================
  // QUERY ENDPOINTS
  // ==========================================
  async findAllRentals(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.rental.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { customer: true, items: { include: { cylinder: true } } },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findAllSales(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { customer: true, items: { include: { product: true } } },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findAllPurchases(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { vendor: true, items: { include: { product: true } } },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findAllStockMovements(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { referenceType: { equals: search.toUpperCase() as any } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { product: true, cylinder: true, createdBy: true },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
