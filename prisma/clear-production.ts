import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INDONESIAN PRODUCTION CLEANUP SCRIPT ---');
  console.log('Memulai pembersihan data transaksi untuk persiapan produksi...\n');

  // 1. Mencari ID pelanggan untuk "Itsna Nihayatul Fitria" dan "Fitria"
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: 'itsna', mode: 'insensitive' } },
        { name: { contains: 'fitria', mode: 'insensitive' } }
      ]
    }
  });

  const targetCustomerIds = customers.map(c => c.id);
  console.log('Pelanggan yang dipertahankan:');
  customers.forEach(c => console.log(` - ${c.name} (${c.id})`));

  if (targetCustomerIds.length === 0) {
    console.warn('WARNING: Tidak ditemukan pelanggan dengan nama Itsna atau Fitria!');
  }

  // 2. Mengambil ID transaksi yang akan dipertahaman
  const preservedRentals = await prisma.rental.findMany({
    where: { customerId: { in: targetCustomerIds } },
    select: { id: true }
  });
  const preservedRentalIds = preservedRentals.map(r => r.id);

  const preservedSales = await prisma.sale.findMany({
    where: { customerId: { in: targetCustomerIds } },
    select: { id: true }
  });
  const preservedSaleIds = preservedSales.map(s => s.id);

  const preservedRefills = await prisma.customerRefill.findMany({
    where: { customerId: { in: targetCustomerIds } },
    select: { id: true }
  });
  const preservedRefillIds = preservedRefills.map(rf => rf.id);

  const allPreservedTransactionIds = [
    ...preservedRentalIds,
    ...preservedSaleIds,
    ...preservedRefillIds
  ];

  console.log(`\nTransaksi yang dipertahankan:`);
  console.log(` - Rentals (Penyewaan): ${preservedRentalIds.length} data`);
  console.log(` - Sales (Penjualan): ${preservedSaleIds.length} data`);
  console.log(` - Customer Refills (Isi Ulang): ${preservedRefillIds.length} data`);

  // 3. Menjalankan penghapusan dan reset dalam transaksi Prisma agar aman (all or nothing)
  await prisma.$transaction(async (tx) => {
    // a. Hapus Activity Log
    const activityLogs = await tx.activityLog.deleteMany({});
    console.log(`\n[1/12] Hapus Activity Log: Berhasil menghapus ${activityLogs.count} log.`);

    // b. Hapus Stock Movements yang tidak terikat dengan transaksi yang dipertahankan
    const stockMovements = await tx.stockMovement.deleteMany({
      where: {
        referenceId: { notIn: allPreservedTransactionIds }
      }
    });
    console.log(`[2/12] Hapus Stock Movements: Berhasil menghapus ${stockMovements.count} riwayat pergerakan stok.`);

    // c. Hapus Income yang tidak terikat dengan transaksi yang dipertahankan
    const incomes = await tx.income.deleteMany({
      where: {
        OR: [
          { referenceId: { notIn: allPreservedTransactionIds } },
          { referenceId: null }
        ]
      }
    });
    console.log(`[3/12] Hapus Incomes: Berhasil menghapus ${incomes.count} data pemasukan.`);

    // d. Hapus Expense (Pengeluaran) - hapus semua karena pengeluaran operasional di masa percobaan/mock
    const expenses = await tx.expense.deleteMany({});
    console.log(`[4/12] Hapus Expenses: Berhasil menghapus ${expenses.count} data pengeluaran.`);

    // e. Hapus Purchase Item (Pembelian dari Vendor)
    const purchaseItems = await tx.purchaseItem.deleteMany({});
    console.log(`[5/12] Hapus Purchase Items: Berhasil menghapus ${purchaseItems.count} item pembelian vendor.`);

    // f. Hapus Purchase (Pembelian dari Vendor)
    const purchases = await tx.purchase.deleteMany({});
    console.log(`[6/12] Hapus Purchases: Berhasil menghapus ${purchases.count} data pembelian vendor.`);

    // g. Hapus Sale Item yang tidak terikat dengan penjualan yang dipertahankan
    const saleItems = await tx.saleItem.deleteMany({
      where: {
        saleId: { notIn: preservedSaleIds }
      }
    });
    console.log(`[7/12] Hapus Sale Items: Berhasil menghapus ${saleItems.count} item penjualan.`);

    // h. Hapus Sale yang tidak terikat dengan pelanggan yang dipertahankan
    const sales = await tx.sale.deleteMany({
      where: {
        id: { notIn: preservedSaleIds }
      }
    });
    console.log(`[8/12] Hapus Sales: Berhasil menghapus ${sales.count} data penjualan.`);

    // i. Hapus Customer Refill Item yang tidak terikat dengan isi ulang yang dipertahankan
    const refillItems = await tx.customerRefillItem.deleteMany({
      where: {
        refillId: { notIn: preservedRefillIds }
      }
    });
    console.log(`[9/12] Hapus Customer Refill Items: Berhasil menghapus ${refillItems.count} item isi ulang.`);

    // j. Hapus Customer Refill yang tidak terikat dengan pelanggan yang dipertahankan
    const refills = await tx.customerRefill.deleteMany({
      where: {
        id: { notIn: preservedRefillIds }
      }
    });
    console.log(`[10/12] Hapus Customer Refills: Berhasil menghapus ${refills.count} data isi ulang.`);

    // k. Hapus Rental Item yang tidak terikat dengan rental yang dipertahankan
    const rentalItems = await tx.rentalItem.deleteMany({
      where: {
        rentalId: { notIn: preservedRentalIds }
      }
    });
    console.log(`[11/12] Hapus Rental Items: Berhasil menghapus ${rentalItems.count} item rental.`);

    // l. Hapus Rental yang tidak terikat dengan pelanggan yang dipertahankan
    const rentals = await tx.rental.deleteMany({
      where: {
        id: { notIn: preservedRentalIds }
      }
    });
    console.log(`[12/12] Hapus Rentals: Berhasil menghapus ${rentals.count} data rental.`);

    // 4. Reset status tabung oksigen (Cylinder) selain milik Itsna dan Fitria
    const resetCylinders = await tx.cylinder.updateMany({
      where: {
        OR: [
          {
            customerId: {
              notIn: targetCustomerIds,
              not: null
            }
          },
          {
            vendorId: {
              not: null
            }
          }
        ]
      },
      data: {
        status: 'AVAILABLE',
        customerId: null,
        vendorId: null
      }
    });
    console.log(`\n[Reset] Cylinder: Berhasil me-reset status ${resetCylinders.count} tabung oksigen.`);

    // 5. Reset saldo pelanggan (Customer balance) selain Itsna dan Fitria
    const resetBalances = await tx.customer.updateMany({
      where: {
        id: {
          notIn: targetCustomerIds
        }
      },
      data: {
        balance: 0.00
      }
    });
    console.log(`[Reset] Customer: Berhasil me-reset saldo ${resetBalances.count} pelanggan lainnya.`);
  });

  console.log('\nProses pembersihan database berhasil diselesaikan! Sistem siap untuk masa produksi.');
}

main()
  .catch((e) => {
    console.error('Error saat melakukan pembersihan database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
