import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- UPDATING REFILL PRICING ACROSS DATABASE ---');

  // 1. Oxygen Types for Refills
  const oxygenTypes = [
    {
      name: 'Isi Ulang Tabung Oksigen 0.3m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 25000.00,
      description: 'Isi Ulang Gas Oksigen Medis Tabung 0.3m3 (25.000)',
      isActive: true,
    },
    {
      name: 'Isi Ulang Tabung Oksigen 0.5m3',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 25000.00,
      description: 'Isi Ulang Gas Oksigen Medis Tabung 0.5m3 (25.000)',
      isActive: true,
    },
    {
      name: 'Isi Ulang Tabung Oksigen Kecil (1m3)',
      purity: 99.50,
      pressure: 150.00,
      pricePerUnit: 50000.00,
      description: 'Isi Ulang Gas Oksigen Medis Tabung Kecil 1m3 (50.000)',
      isActive: true,
    },
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
  ];

  for (const ot of oxygenTypes) {
    const res = await prisma.oxygenType.upsert({
      where: { name: ot.name },
      update: ot,
      create: ot,
    });
    console.log(`[OxygenType] Upserted: ${ot.name} -> Rp ${res.pricePerUnit}`);
  }

  // 2. Products (Refill items for POS / Sales)
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

  const refillProducts = [
    {
      name: 'Refill Tabung 0,3m³',
      sku: 'RFL-03M3',
      description: 'Refill isi ulang gas oksigen tabung 0.3m3',
      categoryId: gasCategory.id,
      price: 25000.00,
      cost: 15000.00,
      currentStock: 50,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Refill Tabung 0,5m³',
      sku: 'RFL-05M3',
      description: 'Refill isi ulang gas oksigen tabung 0.5m3',
      categoryId: gasCategory.id,
      price: 25000.00,
      cost: 15000.00,
      currentStock: 50,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Refill Tabung 1m³',
      sku: 'RFL-1M3',
      description: 'Refill isi ulang gas oksigen tabung 1m3',
      categoryId: gasCategory.id,
      price: 50000.00,
      cost: 25000.00,
      currentStock: 50,
      minStock: 5,
      isActive: true,
    },
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
  ];

  for (const prod of refillProducts) {
    const res = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
    console.log(`[Product] Upserted: ${prod.name} (${prod.sku}) -> Rp ${res.price}`);
  }

  console.log('\n--- SUCCESS: ALL REFILL PRICES UPDATED IN DB ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
