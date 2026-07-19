import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INDONESIAN SPECIFIC RENTALS DELETION SCRIPT ---');
  console.log('Memulai penghapusan transaksi rental: 0025, 0027, 0028, dan 0030...\n');

  const invoices = [
    'RNT-20260718-0025',
    'RNT-20260718-0027',
    'RNT-20260718-0028',
    'RNT-20260718-0030'
  ];

  // 1. Dapatkan record transaksi rental
  const rentals = await prisma.rental.findMany({
    where: { invoiceNo: { in: invoices } }
  });

  const rentalIds = rentals.map(r => r.id);
  console.log(`Menemukan ${rentals.length} dari ${invoices.length} transaksi di database.`);
  rentals.forEach(r => console.log(` - ${r.invoiceNo} (${r.id})`));

  if (rentalIds.length === 0) {
    console.log('Tidak ada transaksi yang ditemukan. Skrip dihentikan.');
    return;
  }

  // Daftar nomor seri tabung yang disewa dalam transaksi-transaksi ini yang perlu di-reset ke AVAILABLE
  const cylindersToReset = [
    'pelembab',
    '25A1 216196PZ27',
    'REG-001-TEST',
    'CYL-MED-002',
    'REG-NES-001',
    '25A1 217101 PZ27',
    'testing oksigen'
  ];

  // 2. Jalankan penghapusan transaksional (all or nothing)
  await prisma.$transaction(async (tx) => {
    // a. Hapus Rental Items
    const deletedRentalItems = await tx.rentalItem.deleteMany({
      where: { rentalId: { in: rentalIds } }
    });
    console.log(`[1/4] Berhasil menghapus ${deletedRentalItems.count} rental items.`);

    // b. Hapus Stock Movements
    const deletedStockMovements = await tx.stockMovement.deleteMany({
      where: {
        referenceId: { in: rentalIds },
        referenceType: { in: ['RENTAL', 'RETURN'] }
      }
    });
    console.log(`[2/4] Berhasil menghapus ${deletedStockMovements.count} riwayat pergerakan stok.`);

    // c. Hapus Income
    const deletedIncomes = await tx.income.deleteMany({
      where: {
        referenceId: { in: rentalIds },
        referenceType: { in: ['RENTAL', 'RETURN'] }
      }
    });
    console.log(`[3/4] Berhasil menghapus ${deletedIncomes.count} data pemasukan.`);

    // d. Hapus Rentals
    const deletedRentals = await tx.rental.deleteMany({
      where: { id: { in: rentalIds } }
    });
    console.log(`[4/4] Berhasil menghapus ${deletedRentals.count} data utama rental.`);

    // e. Reset status tabung oksigen
    const updatedCylinders = await tx.cylinder.updateMany({
      where: { serialNumber: { in: cylindersToReset } },
      data: {
        status: 'AVAILABLE',
        customerId: null
      }
    });
    console.log(`\n[Reset] Berhasil me-reset status ${updatedCylinders.count} tabung oksigen menjadi AVAILABLE.`);
  });

  console.log('\nPenghapusan transaksi selesai! Database telah diperbarui.');
}

main()
  .catch((e) => {
    console.error('Error saat menjalankan pembersihan transaksi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
