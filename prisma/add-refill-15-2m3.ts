import { PrismaClient, CylinderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ADDING REFILL & CYLINDER 1.5m3 & 2m3 TO DATABASE ---');

  // 1. Oxygen Types for Refill & Cylinders
  const oxygenTypesToUpsert = [
    {
      name: 'Isi Ulang Tabung Oksigen 1.5m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 75000.00,
      description: 'Isi Ulang Gas Oksigen Medis Tabung 1.5m3 (75.000)',
      isActive: true,
    },
    {
      name: 'Isi Ulang Tabung Oksigen 2m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 75000.00,
      description: 'Isi Ulang Gas Oksigen Medis Tabung 2m3 (75.000)',
      isActive: true,
    },
    {
      name: 'Tabung Oksigen 1.5m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 75000.00,
      description: 'Gas Oksigen Medis Tabung 1.5m3',
      isActive: true,
    },
    {
      name: 'Tabung Oksigen 2m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 75000.00,
      description: 'Gas Oksigen Medis Tabung 2m3',
      isActive: true,
    },
  ];

  const dbOxygenTypes: Record<string, any> = {};
  for (const ot of oxygenTypesToUpsert) {
    const res = await prisma.oxygenType.upsert({
      where: { name: ot.name },
      update: ot,
      create: ot,
    });
    dbOxygenTypes[ot.name] = res;
    console.log(`[OxygenType] Upserted: ${ot.name} -> ID: ${res.id}`);
  }

  // 2. Category Gas
  let gasCategory = await prisma.category.findUnique({
    where: { name: 'Gas' },
  });
  if (!gasCategory) {
    gasCategory = await prisma.category.create({
      data: {
        name: 'Gas',
        description: 'Gas refill and supply',
        isActive: true,
      },
    });
  }

  // 3. Products
  const productsToUpsert = [
    {
      name: 'Refill Tabung 1,5m³',
      sku: 'RFL-15M3',
      description: 'Refill isi ulang gas oksigen tabung 1.5m3',
      categoryId: gasCategory.id,
      price: 75000.00,
      cost: 40000.00,
      currentStock: 50,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Refill Tabung 2m³',
      sku: 'RFL-2M3',
      description: 'Refill isi ulang gas oksigen tabung 2m3',
      categoryId: gasCategory.id,
      price: 75000.00,
      cost: 40000.00,
      currentStock: 50,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Tabung Oksigen Sedang (1.5m3)',
      sku: 'TBG-15M3-FULL',
      description: 'Tabung gas oksigen medis 1.5m3 lengkap',
      categoryId: gasCategory.id,
      price: 950000.00,
      cost: 700000.00,
      currentStock: 20,
      minStock: 3,
      isActive: true,
    },
    {
      name: 'Tabung Oksigen Sedang (2m3)',
      sku: 'TBG-2M3-FULL',
      description: 'Tabung gas oksigen medis 2m3 lengkap',
      categoryId: gasCategory.id,
      price: 1150000.00,
      cost: 850000.00,
      currentStock: 20,
      minStock: 3,
      isActive: true,
    },
  ];

  for (const prod of productsToUpsert) {
    const res = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
    console.log(`[Product] Upserted: ${prod.name} (${prod.sku}) -> Price: ${res.price}`);
  }

  // 4. Create Cylinders for 1.5m3 and 2m3 so inventory / warehouse detects them
  const baseTimestamp = Date.now();
  
  // 10 cylinders of 1.5m3
  for (let i = 1; i <= 10; i++) {
    const serialNumber = `CYL-1.5M3-${String(i).padStart(3, '0')}`;
    await prisma.cylinder.upsert({
      where: { serialNumber },
      update: {
        capacity: 10.0,
        size: '1.5m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: dbOxygenTypes['Tabung Oksigen 1.5m3'].id,
      },
      create: {
        serialNumber,
        capacity: 10.0,
        size: '1.5m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: dbOxygenTypes['Tabung Oksigen 1.5m3'].id,
      },
    });
  }
  console.log('[Cylinder] Created 10 units of 1.5m3 cylinders (AVAILABLE)');

  // 10 cylinders of 2m3
  for (let i = 1; i <= 10; i++) {
    const serialNumber = `CYL-2M3-${String(i).padStart(3, '0')}`;
    await prisma.cylinder.upsert({
      where: { serialNumber },
      update: {
        capacity: 14.0,
        size: '2m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: dbOxygenTypes['Tabung Oksigen 2m3'].id,
      },
      create: {
        serialNumber,
        capacity: 14.0,
        size: '2m3',
        status: CylinderStatus.AVAILABLE,
        oxygenTypeId: dbOxygenTypes['Tabung Oksigen 2m3'].id,
      },
    });
  }
  console.log('[Cylinder] Created 10 units of 2m3 cylinders (AVAILABLE)');

  console.log('\n--- SUCCESS: ALL DATA ADDED TO DATABASE ---');
}

main()
  .catch((e) => {
    console.error('Error inserting data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
