import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning mock/test data from database...');

  // Start a transaction to ensure all or nothing is deleted
  await prisma.$transaction(async (tx) => {
    // 1. Delete transactions and dependent logs
    const activityLogs = await tx.activityLog.deleteMany({});
    console.log(`Deleted ${activityLogs.count} activity logs.`);

    const stockMovements = await tx.stockMovement.deleteMany({});
    console.log(`Deleted ${stockMovements.count} stock movements.`);

    const incomes = await tx.income.deleteMany({});
    console.log(`Deleted ${incomes.count} incomes.`);

    const expenses = await tx.expense.deleteMany({});
    console.log(`Deleted ${expenses.count} expenses.`);

    // 2. Delete Purchases
    const purchaseItems = await tx.purchaseItem.deleteMany({});
    console.log(`Deleted ${purchaseItems.count} purchase items.`);

    const purchases = await tx.purchase.deleteMany({});
    console.log(`Deleted ${purchases.count} purchases.`);

    // 3. Delete Sales
    const saleItems = await tx.saleItem.deleteMany({});
    console.log(`Deleted ${saleItems.count} sale items.`);

    const sales = await tx.sale.deleteMany({});
    console.log(`Deleted ${sales.count} sales.`);

    // 3b. Delete Customer Refills
    const refillItems = await tx.customerRefillItem.deleteMany({});
    console.log(`Deleted ${refillItems.count} customer refill items.`);

    const refills = await tx.customerRefill.deleteMany({});
    console.log(`Deleted ${refills.count} customer refills.`);

    // 4. Delete Rentals
    const rentalItems = await tx.rentalItem.deleteMany({});
    console.log(`Deleted ${rentalItems.count} rental items.`);

    const rentals = await tx.rental.deleteMany({});
    console.log(`Deleted ${rentals.count} rentals.`);

    // 5. Delete Cylinders
    const cylinders = await tx.cylinder.deleteMany({});
    console.log(`Deleted ${cylinders.count} cylinders.`);

    // 6. Delete Products & Categories
    const products = await tx.product.deleteMany({});
    console.log(`Deleted ${products.count} products.`);

    // 7. Delete Categories
    const categories = await tx.category.deleteMany({});
    console.log(`Deleted ${categories.count} categories.`);

    // 8. Delete Oxygen Types
    const oxygenTypes = await tx.oxygenType.deleteMany({});
    console.log(`Deleted ${oxygenTypes.count} oxygen types.`);

    // 9. Delete Customers & Vendors
    const customers = await tx.customer.deleteMany({});
    console.log(`Deleted ${customers.count} customers.`);

    const vendors = await tx.vendor.deleteMany({});
    console.log(`Deleted ${vendors.count} vendors.`);
  });

  console.log('Successfully cleaned database! Ready for production.');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
