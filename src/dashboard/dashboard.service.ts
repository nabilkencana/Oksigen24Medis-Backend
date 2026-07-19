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
      allProducts,
      recentMovements,
      rentedBigCylindersCount,
      rentedSmallCylindersCount,
      rentedRegulatorsCount,
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

      // 6. Low Stock Products count (fetch all and filter in memory)
      this.prisma.product.findMany({
        where: {
          deletedAt: null,
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

      // 8. Rented Big Cylinders (status = RENTED, size = '6m3')
      this.prisma.cylinder.count({
        where: {
          status: CylinderStatus.RENTED,
          size: '6m3',
          deletedAt: null,
        },
      }),

      // 9. Rented Small Cylinders (status = RENTED, not size 6m3 or PCS, and not reg/trl/acc)
      this.prisma.cylinder.count({
        where: {
          status: CylinderStatus.RENTED,
          size: { notIn: ['6m3', 'PCS'] },
          NOT: [
            { serialNumber: { startsWith: 'REG-' } },
            { serialNumber: { startsWith: 'TRL-' } },
            { serialNumber: { startsWith: 'ACC-' } },
          ],
          deletedAt: null,
        },
      }),

      // 10. Rented Regulators (status = RENTED, serial starts with REG- or size = PCS)
      this.prisma.cylinder.count({
        where: {
          status: CylinderStatus.RENTED,
          OR: [
            { serialNumber: { startsWith: 'REG-' } },
            { size: 'PCS' },
          ],
          deletedAt: null,
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter(
      (p) => p.currentStock <= p.minStock,
    );

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
      rentedBigCylinders: rentedBigCylindersCount,
      rentedSmallCylinders: rentedSmallCylindersCount,
      rentedRegulators: rentedRegulatorsCount,
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

  async getNotifications() {
    // Fetch 50 latest events across all transaction types in parallel
    const [rentals, returns, sales, customerRefills, vendorSends, vendorReceives, purchases] =
      await Promise.all([
        // Kontrak Sewa Baru
        this.prisma.rental.findMany({
          take: 15,
          orderBy: { createdAt: 'desc' },
          where: { deletedAt: null },
          include: {
            customer: { select: { name: true } },
            createdBy: { select: { fullName: true } },
            items: { include: { cylinder: { select: { serialNumber: true, size: true } } } },
          },
        }),

        // Pengembalian Tabung
        this.prisma.rental.findMany({
          take: 15,
          orderBy: { updatedAt: 'desc' },
          where: { status: 'RETURNED', deletedAt: null, returnDate: { not: null } },
          include: {
            customer: { select: { name: true } },
            createdBy: { select: { fullName: true } },
            items: { include: { cylinder: { select: { serialNumber: true, size: true } } } },
          },
        }),

        // Penjualan Produk
        this.prisma.sale.findMany({
          take: 15,
          orderBy: { createdAt: 'desc' },
          where: { deletedAt: null },
          include: {
            customer: { select: { name: true } },
            createdBy: { select: { fullName: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        }),

        // Isi Ulang Pelanggan
        this.prisma.customerRefill.findMany({
          take: 15,
          orderBy: { createdAt: 'desc' },
          where: { deletedAt: null },
          include: {
            customer: { select: { name: true } },
            createdBy: { select: { fullName: true } },
            items: true,
          },
        }),

        // Kirim ke Vendor
        this.prisma.stockMovement.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { referenceType: 'VENDOR_REFILL', type: 'OUT' },
          include: {
            cylinder: { select: { serialNumber: true, size: true } },
            createdBy: { select: { fullName: true } },
          },
        }),

        // Terima dari Vendor
        this.prisma.stockMovement.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { referenceType: 'VENDOR_REFILL', type: 'IN' },
          include: {
            cylinder: { select: { serialNumber: true, size: true } },
            createdBy: { select: { fullName: true } },
          },
        }),

        // Pembelian Produk
        this.prisma.purchase.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { deletedAt: null },
          include: {
            vendor: { select: { name: true } },
            createdBy: { select: { fullName: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        }),
      ]);

    const notifications: Array<{
      id: string;
      notifType: string;
      title: string;
      message: string;
      category: 'success' | 'info' | 'warning' | 'alert';
      amount?: number;
      createdAt: Date;
      createdBy: string;
    }> = [];

    // Map rentals
    for (const r of rentals) {
      const cylinders = r.items.map((i) => `${i.cylinder.size}`).join(', ');
      notifications.push({
        id: `rental_${r.id}`,
        notifType: 'RENTAL',
        title: 'Kontrak Sewa Baru',
        message: `${r.customer?.name ?? 'Pelanggan'} menyewa ${r.items.length} tabung (${cylinders}). No. Invoice: ${r.invoiceNo}.`,
        category: 'success',
        amount: Number(r.totalAmount),
        createdAt: r.createdAt,
        createdBy: r.createdBy.fullName,
      });
    }

    // Map returns (only those with returnDate)
    for (const r of returns) {
      if (!r.returnDate) continue;
      const cylinders = r.items.map((i) => `${i.cylinder.size}`).join(', ');
      notifications.push({
        id: `return_${r.id}`,
        notifType: 'RETURN',
        title: 'Pengembalian Tabung',
        message: `${r.customer?.name ?? 'Pelanggan'} mengembalikan ${r.items.length} tabung (${cylinders}). Invoice: ${r.invoiceNo}.`,
        category: 'info',
        createdAt: r.returnDate,
        createdBy: r.createdBy.fullName,
      });
    }

    // Map sales
    for (const s of sales) {
      const items = s.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(', ');
      notifications.push({
        id: `sale_${s.id}`,
        notifType: 'SALE',
        title: 'Penjualan Produk',
        message: `${s.customer?.name ?? 'Umum'} membeli ${items}. Invoice: ${s.invoiceNo}.`,
        category: 'success',
        amount: Number(s.totalAmount),
        createdAt: s.createdAt,
        createdBy: s.createdBy.fullName,
      });
    }

    // Map customer refills
    for (const cr of customerRefills) {
      const sizes = cr.items.map((i) => `${i.cylinderSize} (${i.quantity}x)`).join(', ');
      notifications.push({
        id: `refill_${cr.id}`,
        notifType: 'CUSTOMER_REFILL',
        title: 'Isi Ulang Pelanggan',
        message: `${cr.customer?.name ?? 'Pelanggan'} mengisi ulang tabung: ${sizes}. Invoice: ${cr.invoiceNo}.`,
        category: 'success',
        amount: Number(cr.totalAmount),
        createdAt: cr.createdAt,
        createdBy: cr.createdBy.fullName,
      });
    }

    // Map vendor sends
    for (const m of vendorSends) {
      notifications.push({
        id: `vsend_${m.id}`,
        notifType: 'VENDOR_SEND',
        title: 'Tabung Dikirim ke Vendor',
        message: `Tabung ${m.cylinder?.serialNumber ?? ''} (${m.cylinder?.size ?? ''}) dikirim untuk pengisian ulang.`,
        category: 'warning',
        createdAt: m.createdAt,
        createdBy: m.createdBy.fullName,
      });
    }

    // Map vendor receives
    for (const m of vendorReceives) {
      notifications.push({
        id: `vrecv_${m.id}`,
        notifType: 'VENDOR_RECEIVE',
        title: 'Tabung Diterima dari Vendor',
        message: `Tabung ${m.cylinder?.serialNumber ?? ''} (${m.cylinder?.size ?? ''}) sudah diisi ulang dan diterima kembali.`,
        category: 'info',
        createdAt: m.createdAt,
        createdBy: m.createdBy.fullName,
      });
    }

    // Map purchases
    for (const p of purchases) {
      const items = p.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(', ');
      notifications.push({
        id: `purchase_${p.id}`,
        notifType: 'PURCHASE',
        title: 'Pembelian Stok',
        message: `Pembelian dari ${p.vendor.name}: ${items}. Invoice: ${p.invoiceNo}.`,
        category: 'info',
        amount: Number(p.totalAmount),
        createdAt: p.createdAt,
        createdBy: p.createdBy.fullName,
      });
    }

    // Sort all by createdAt descending
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return notifications.slice(0, 50);
  }
}
