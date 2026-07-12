import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning transactional and mock database records...');

  // Delete in reverse order of foreign key constraints
  await prisma.activityLog.deleteMany({});
  console.log('- ActivityLog deleted');

  await prisma.stockMovement.deleteMany({});
  console.log('- StockMovement deleted');

  await prisma.income.deleteMany({});
  console.log('- Income deleted');

  await prisma.expense.deleteMany({});
  console.log('- Expense deleted');

  await prisma.rentalItem.deleteMany({});
  console.log('- RentalItem deleted');

  await prisma.rental.deleteMany({});
  console.log('- Rental deleted');

  await prisma.saleItem.deleteMany({});
  console.log('- SaleItem deleted');

  await prisma.sale.deleteMany({});
  console.log('- Sale deleted');

  await prisma.purchaseItem.deleteMany({});
  console.log('- PurchaseItem deleted');

  await prisma.purchase.deleteMany({});
  console.log('- Purchase deleted');

  await prisma.cylinder.deleteMany({});
  console.log('- Cylinder deleted');

  await prisma.product.deleteMany({});
  console.log('- Product deleted');

  await prisma.category.deleteMany({});
  console.log('- Category deleted');

  await prisma.customer.deleteMany({});
  console.log('- Customer deleted');

  await prisma.vendor.deleteMany({});
  console.log('- Vendor deleted');

  console.log('Database successfully cleaned for production!');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
