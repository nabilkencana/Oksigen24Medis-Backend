import { PrismaClient, CylinderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- UPSERTING 50 UNITS FOR 1.5m3 AND 2m3 CYLINDERS ---');

  const ot15 = await prisma.oxygenType.findFirst({
    where: {
      OR: [
        { name: 'Tabung Oksigen 1.5m3' },
        { name: 'Isi Ulang Tabung Oksigen 1.5m3' }
      ]
    }
  });

  const ot20 = await prisma.oxygenType.findFirst({
    where: {
      OR: [
        { name: 'Tabung Oksigen 2m3' },
        { name: 'Isi Ulang Tabung Oksigen 2m3' }
      ]
    }
  });

  if (!ot15 || !ot20) {
    throw new Error('OxygenType 1.5m3 or 2m3 not found');
  }

  // Create 50 units for 1.5m3
  for (let i = 1; i <= 50; i++) {
    const serialNumber = `CYL-1.5M3-${String(i).padStart(3, '0')}`;
    await prisma.cylinder.upsert({
      where: { serialNumber },
      update: {
        capacity: 10.0,
        size: '1.5m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: ot15.id,
      },
      create: {
        serialNumber,
        capacity: 10.0,
        size: '1.5m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: ot15.id,
      },
    });
  }
  console.log('50 units of 1.5m3 cylinders successfully upserted in database.');

  // Create 50 units for 2m3
  for (let i = 1; i <= 50; i++) {
    const serialNumber = `CYL-2M3-${String(i).padStart(3, '0')}`;
    await prisma.cylinder.upsert({
      where: { serialNumber },
      update: {
        capacity: 14.0,
        size: '2m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: ot20.id,
      },
      create: {
        serialNumber,
        capacity: 14.0,
        size: '2m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: ot20.id,
      },
    });
  }
  console.log('50 units of 2m3 cylinders successfully upserted in database.');

  const count15 = await prisma.cylinder.count({ where: { size: '1.5m3' } });
  const count20 = await prisma.cylinder.count({ where: { size: '2m3' } });
  console.log(`Verified counts -> 1.5m3: ${count15}, 2m3: ${count20}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
