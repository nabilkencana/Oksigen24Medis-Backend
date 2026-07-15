const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const movements = await prisma.stockMovement.findMany({
    include: {
      product: true,
      cylinder: true,
      createdBy: true
    }
  });
  console.log('Stock Movements in DB:');
  console.log(JSON.stringify(movements, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
