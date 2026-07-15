const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database test data...');
  
  // Update REG-001-TEST
  await prisma.cylinder.update({
    where: { serialNumber: 'REG-001-TEST' },
    data: {
      oxygenTypeId: '41d23cd4-79f5-458b-bae4-dbdf65e00aa1', // Sewa Regulator
      status: 'AVAILABLE'
    }
  });

  // Update testing oksigen
  await prisma.cylinder.update({
    where: { serialNumber: 'testing oksigen' },
    data: {
      oxygenTypeId: '41d23cd4-79f5-458b-bae4-dbdf65e00aa1', // Sewa Regulator
      status: 'AVAILABLE'
    }
  });

  console.log('Update completed successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
