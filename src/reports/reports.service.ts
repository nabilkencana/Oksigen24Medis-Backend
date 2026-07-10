import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GroupByOption, ReportQueryDto } from './dto/report-query.dto';
import { CylinderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // REVENUE REPORT
  // ==========================================
  async getRevenueReport(query: ReportQueryDto) {
    const { startDate, endDate, groupBy } = query;
    const where: any = { deletedAt: null };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const incomes = await this.prisma.income.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Aggregate by category
    const categoryTotals: Record<string, number> = {};
    let totalRevenue = 0;

    incomes.forEach((inc) => {
      const amount = Number(inc.amount);
      totalRevenue += amount;
      categoryTotals[inc.category] =
        (categoryTotals[inc.category] || 0) + amount;
    });

    // Group by Date/Period
    const periodMap = new Map<string, number>();
    incomes.forEach((inc) => {
      const periodKey = this.getPeriodKey(
        inc.date,
        groupBy || GroupByOption.DAILY,
      );
      periodKey &&
        periodMap.set(
          periodKey,
          (periodMap.get(periodKey) || 0) + Number(inc.amount),
        );
    });

    const timeline = Array.from(periodMap.entries()).map(
      ([period, amount]) => ({
        period,
        amount,
      }),
    );

    return {
      totalRevenue,
      categoryTotals,
      timeline,
      itemCount: incomes.length,
      startDate: startDate || null,
      endDate: endDate || null,
    };
  }

  // ==========================================
  // RENTAL REPORT
  // ==========================================
  async getRentalReport(query: ReportQueryDto) {
    const { startDate, endDate } = query;
    const where: any = { deletedAt: null };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate;
      if (endDate) where.startDate.lte = endDate;
    }

    const rentals = await this.prisma.rental.findMany({
      where,
      include: { customer: true, items: { include: { cylinder: true } } },
      orderBy: { startDate: 'desc' },
    });

    const totalRentals = rentals.length;
    let rentingCount = 0;
    let returnedCount = 0;
    let totalVolumeLeased = 0; // sum of cylinder capacities

    rentals.forEach((r) => {
      if (r.status === 'RENTING') rentingCount++;
      if (r.status === 'RETURNED') returnedCount++;
      r.items.forEach((item) => {
        totalVolumeLeased += Number(item.cylinder.capacity);
      });
    });

    return {
      summary: {
        totalRentals,
        activeRentals: rentingCount,
        returnedRentals: returnedCount,
        totalCapacityLeasedLiters: totalVolumeLeased,
      },
      rentals: rentals.map((r) => ({
        id: r.id,
        invoiceNo: r.invoiceNo,
        customerName: r.customer.name,
        startDate: r.startDate,
        dueDate: r.dueDate,
        returnDate: r.returnDate,
        totalAmount: Number(r.totalAmount),
        amountPaid: Number(r.amountPaid),
        status: r.status,
        cylindersCount: r.items.length,
      })),
    };
  }

  // ==========================================
  // INVENTORY REPORT
  // ==========================================
  async getInventoryReport() {
    const [products, cylinders, cylinderCounts, lowStockProducts] =
      await Promise.all([
        // Products Catalog
        this.prisma.product.findMany({
          where: { deletedAt: null },
          include: { category: true },
        }),

        // Total Cylinders
        this.prisma.cylinder.findMany({
          where: { deletedAt: null },
          include: { oxygenType: true },
        }),

        // Cylinder count grouped by status
        this.prisma.cylinder.groupBy({
          where: { deletedAt: null },
          by: ['status'],
          _count: { id: true },
        }),

        // Low stock products list
        this.prisma.product.findMany({
          where: {
            deletedAt: null,
            currentStock: { lte: this.prisma.product.fields.minStock },
          },
        }),
      ]);

    // Format cylinder status summary
    const cylinderStatusSummary: Record<string, number> = {
      AVAILABLE: 0,
      RENTED: 0,
      AT_VENDOR: 0,
      MAINTENANCE: 0,
      EMPTY: 0,
    };
    cylinderCounts.forEach((group) => {
      cylinderStatusSummary[group.status] = group._count.id;
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
        price: Number(p.price),
        cost: Number(p.cost),
        valuation: p.currentStock * Number(p.cost),
      })),
      cylinders: {
        total: cylinders.length,
        statuses: cylinderStatusSummary,
      },
      lowStockAlerts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStock: p.minStock,
      })),
    };
  }

  // ==========================================
  // EXPENSE REPORT
  // ==========================================
  async getExpenseReport(query: ReportQueryDto) {
    const { startDate, endDate, groupBy } = query;
    const where: any = { deletedAt: null };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((exp) => {
      const amount = Number(exp.amount);
      totalExpense += amount;
      categoryTotals[exp.category] =
        (categoryTotals[exp.category] || 0) + amount;
    });

    const periodMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const periodKey = this.getPeriodKey(
        exp.date,
        groupBy || GroupByOption.DAILY,
      );
      periodKey &&
        periodMap.set(
          periodKey,
          (periodMap.get(periodKey) || 0) + Number(exp.amount),
        );
    });

    const timeline = Array.from(periodMap.entries()).map(
      ([period, amount]) => ({
        period,
        amount,
      }),
    );

    return {
      totalExpense,
      categoryTotals,
      timeline,
      itemCount: expenses.length,
      startDate: startDate || null,
      endDate: endDate || null,
    };
  }

  // Helper date formatting
  private getPeriodKey(date: Date, groupBy: GroupByOption): string {
    const d = new Date(date);
    if (groupBy === GroupByOption.YEARLY) {
      return `${d.getFullYear()}`;
    }
    if (groupBy === GroupByOption.MONTHLY) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${d.getFullYear()}-${month}`;
    }
    // Default DAILY
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}
