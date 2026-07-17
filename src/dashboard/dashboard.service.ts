import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CylinderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch summaries in parallel using Promise.all
    const [
      todayIncomeSum,
      monthlyIncomeSum,
      activeRentalsCount,
      availableCylindersCount,
      vendorCylindersCount,
      lowStockProducts,
      recentMovements,
    ] = await Promise.all([
      // 1. Today's Revenue
      this.prisma.income.aggregate({
        where: {
          date: { gte: today },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),

      // 2. Monthly Revenue
      this.prisma.income.aggregate({
        where: {
          date: { gte: startOfMonth },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),

      // 3. Active Rentals (Status = RENTING)
      this.prisma.rental.count({
        where: {
          status: 'RENTING',
          deletedAt: null,
        },
      }),

      // 4. Available Cylinders
      this.prisma.cylinder.count({
        where: {
          status: CylinderStatus.AVAILABLE,
          deletedAt: null,
        },
      }),

      // 5. Vendor Cylinders
      this.prisma.cylinder.count({
        where: {
          status: CylinderStatus.AT_VENDOR,
          deletedAt: null,
        },
      }),

      // 6. Low Stock Products count
      this.prisma.product.findMany({
        where: {
          deletedAt: null,
          currentStock: { lte: this.prisma.product.fields.minStock },
        },
        include: { category: true },
      }),

      // 7. Recent stock movements
      this.prisma.stockMovement.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          cylinder: true,
          createdBy: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    // Fetch customer refills for recent movements if any
    const refillIds = recentMovements
      .filter((m) => m.referenceType === 'CUSTOMER_REFILL')
      .map((m) => m.referenceId);

    const refillItemsMap = new Map<string, string>();
    if (refillIds.length > 0) {
      const refills = await this.prisma.customerRefill.findMany({
        where: { id: { in: refillIds } },
        include: { items: true },
      });
      refills.forEach((r) => {
        const itemNames = r.items.map((item) => `${item.cylinderSize}`).join(', ');
        refillItemsMap.set(r.id, `Isi Ulang ${itemNames}`);
      });
    }

    // 8. Revenue Chart for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incomesLast30Days = await this.prisma.income.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      select: {
        date: true,
        amount: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group incomes by date
    const chartMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartMap.set(key, 0);
    }

    incomesLast30Days.forEach((inc) => {
      const key = inc.date.toISOString().slice(0, 10);
      if (chartMap.has(key)) {
        chartMap.set(key, (chartMap.get(key) ?? 0) + Number(inc.amount));
      }
    });

    const revenueChart = Array.from(chartMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .reverse();

    return {
      todayRevenue: Number(todayIncomeSum._sum.amount || 0),
      monthlyRevenue: Number(monthlyIncomeSum._sum.amount || 0),
      activeRentals: activeRentalsCount,
      availableCylinders: availableCylindersCount,
      vendorCylinders: vendorCylindersCount,
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts,
      recentActivities: recentMovements.map((m) => ({
        id: m.id,
        type: m.type,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        itemName:
          m.product?.name ||
          (m.cylinder ? `Tabung ${m.cylinder.serialNumber} (${m.cylinder.size})` : null) ||
          (m.referenceType === 'CUSTOMER_REFILL' ? refillItemsMap.get(m.referenceId) : null) ||
          'N/A',
        quantity: m.quantity,
        beforeStock: m.beforeStock,
        afterStock: m.afterStock,
        createdBy: m.createdBy.fullName,
        createdAt: m.createdAt,
      })),
      revenueChart,
    };
  }
}
