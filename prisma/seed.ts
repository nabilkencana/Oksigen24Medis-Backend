import { PrismaClient, UserRole, CylinderStatus, PaymentStatus, MovementType, MovementReferenceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const roles = [
    { name: UserRole.OWNER, description: 'Business Owner with full system access' },
    { name: UserRole.ADMIN, description: 'System Administrator for operations management' },
    { name: UserRole.FINANCE, description: 'Finance Specialist to manage billing, income, and expenses' },
    { name: UserRole.WAREHOUSE, description: 'Warehouse Operator to handle cylinder movements and stock' },
  ];

  const dbRoles: Record<UserRole, any> = {} as any;

  for (const r of roles) {
    const dbRole = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    dbRoles[r.name] = dbRole;
    console.log(`Role ${r.name} upserted.`);
  }

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const users = [
    { email: 'owner@medis24.com', fullName: 'John Owner', roleId: dbRoles[UserRole.OWNER].id },
    { email: 'admin@medis24.com', fullName: 'Alice Admin', roleId: dbRoles[UserRole.ADMIN].id },
    { email: 'finance@medis24.com', fullName: 'Bob Finance', roleId: dbRoles[UserRole.FINANCE].id },
    { email: 'warehouse@medis24.com', fullName: 'Charlie Warehouse', roleId: dbRoles[UserRole.WAREHOUSE].id },
  ];

  const dbUsers: Record<string, any> = {};

  for (const u of users) {
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, passwordHash, roleId: u.roleId },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        roleId: u.roleId,
        isActive: true,
      },
    });
    dbUsers[u.email] = dbUser;
    console.log(`User ${u.email} upserted.`);
  }

  // 3. Seed Company Settings
  const settings = [
    { key: 'company_name', value: 'Oksigen 24 Medis Tulungagung', description: 'Name of the business' },
    { key: 'company_phone', value: '0858-6697-2209', description: 'Contact phone number' },
    { key: 'company_email', value: 'info@medis24.com', description: 'Contact email address' },
    { key: 'company_address', value: 'Dusun Sembon, Sembon, Kec. Karangrejo, Kabupaten Tulungagung, Jawa Timur 66253', description: 'Physical store address' },
    { key: 'rental_deposit_fee', value: '200000', description: 'Standard deposit amount for renting a cylinder' },
    { key: 'overdue_penalty_per_day', value: '15000', description: 'Late return fee per cylinder per day' },
  ];

  for (const s of settings) {
    await prisma.companySetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }
  console.log('Company settings upserted.');

  // 4. Seed Customers
  const customers = [
    { name: 'Budi Santoso', phone: '0811223344', email: 'budi@gmail.com', address: 'Jl. Melati No. 5, Jakarta' },
    { name: 'RS Kasih Ibu', phone: '021998877', email: 'info@rskasihibu.co.id', address: 'Jl. Sudirman No. 102, Jakarta' },
    { name: 'Siti Rahma', phone: '0855667788', email: 'siti@yahoo.com', address: 'Jl. Mawar No. 12, Bekasi' },
  ];

  const dbCustomers: any[] = [];
  for (const c of customers) {
    const dbCust = await prisma.customer.create({
      data: c,
    });
    dbCustomers.push(dbCust);
  }
  console.log('Customers created.');

  // 5. Seed Vendors
  const vendors = [
    { name: 'PT Samator Gas Industri', phone: '0215551234', email: 'sales@samator.com', address: 'Kawasan Industri Pulo Gadung, Jakarta' },
    { name: 'PT Linde Indonesia', phone: '0215555678', email: 'support@linde.com', address: 'Cikarang, Bekasi' },
  ];

  const dbVendors: any[] = [];
  for (const v of vendors) {
    const dbVend = await prisma.vendor.create({
      data: v,
    });
    dbVendors.push(dbVend);
  }
  console.log('Vendors created.');

  // 6. Seed Oxygen Types
  const oxygenTypes = [
    { name: 'Medical Oxygen 99.5%', purity: 99.50, pressure: 150.00, pricePerUnit: 75000.00, description: 'High purity medical grade oxygen' },
    { name: 'Industrial Oxygen 99.0%', purity: 99.00, pressure: 150.00, pricePerUnit: 50000.00, description: 'Industrial grade oxygen for welding & cutting' },
    { name: 'Sewa Regulator Medis', purity: 0.00, pressure: 0.00, pricePerUnit: 35000.00, description: 'Sewa regulator oksigen medis standar' },
    { name: 'Sewa Troli Tabung 1m3', purity: 0.00, pressure: 0.00, pricePerUnit: 20000.00, description: 'Sewa troli besi dorong tabung 1m3' },
  ];

  const dbOxygenTypes: any[] = [];
  for (const ot of oxygenTypes) {
    const dbOt = await prisma.oxygenType.upsert({
      where: { name: ot.name },
      update: ot,
      create: ot,
    });
    dbOxygenTypes.push(dbOt);
  }
  console.log('Oxygen types upserted.');

  // 7. Seed Cylinders
  const cylinders = [
    { serialNumber: 'CYL-MED-001', capacity: 40.0, size: '6m3', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[0].id },
    { serialNumber: 'CYL-MED-002', capacity: 40.0, size: '6m3', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[0].id },
    { serialNumber: 'CYL-MED-003', capacity: 10.0, size: '1m3', status: CylinderStatus.RENTED, oxygenTypeId: dbOxygenTypes[0].id, customerId: dbCustomers[1].id },
    { serialNumber: 'CYL-MED-004', capacity: 10.0, size: '1m3', status: CylinderStatus.RENTED, oxygenTypeId: dbOxygenTypes[0].id, customerId: dbCustomers[0].id },
    { serialNumber: 'CYL-MED-005', capacity: 40.0, size: '6m3', status: CylinderStatus.EMPTY, oxygenTypeId: dbOxygenTypes[0].id },
    { serialNumber: 'CYL-IND-001', capacity: 40.0, size: '6m3', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[1].id },
    { serialNumber: 'CYL-IND-002', capacity: 40.0, size: '6m3', status: CylinderStatus.AT_VENDOR, oxygenTypeId: dbOxygenTypes[1].id, vendorId: dbVendors[0].id },
    { serialNumber: 'CYL-IND-003', capacity: 10.0, size: '1m3', status: CylinderStatus.MAINTENANCE, oxygenTypeId: dbOxygenTypes[1].id },
    // Accessories represented as cylinders for rental tracking
    { serialNumber: 'REG-NES-001', capacity: 0.0, size: 'Pcs', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[2].id },
    { serialNumber: 'REG-NES-002', capacity: 0.0, size: 'Pcs', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[2].id },
    { serialNumber: 'TRL-STL-001', capacity: 0.0, size: 'Pcs', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[3].id },
    { serialNumber: 'TRL-STL-002', capacity: 0.0, size: 'Pcs', status: CylinderStatus.AVAILABLE, oxygenTypeId: dbOxygenTypes[3].id },
  ];

  for (const cyl of cylinders) {
    await prisma.cylinder.upsert({
      where: { serialNumber: cyl.serialNumber },
      update: {
        capacity: cyl.capacity,
        size: cyl.size,
        status: cyl.status,
        oxygenTypeId: cyl.oxygenTypeId,
        customerId: cyl.customerId || null,
        vendorId: cyl.vendorId || null,
      },
      create: cyl,
    });
  }
  console.log('Cylinders upserted.');

  // 8. Seed Product Categories and Products
  const categories = [
    { name: 'Regulators', description: 'Oxygen regulators and flowmeters' },
    { name: 'Trolleys & Stands', description: 'Trolleys and stands for oxygen cylinders' },
    { name: 'Consumables', description: 'Nasal cannulas, masks, tubes' },
  ];

  const dbCategories: any[] = [];
  for (const cat of categories) {
    const dbCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    dbCategories.push(dbCat);
  }
  console.log('Categories upserted.');

  const products = [
    { name: 'Nesco Oxygen Regulator', sku: 'REG-NES-001', description: 'Medical grade regulator with humidifier bottle', price: 350000.0, cost: 210000.0, currentStock: 25, minStock: 5, categoryId: dbCategories[0].id },
    { name: 'Steel Cylinder Trolley 1m3', sku: 'TRL-STL-001', description: 'Heavy duty steel trolley for 1m3 cylinders', price: 180000.0, cost: 110000.0, currentStock: 12, minStock: 3, categoryId: dbCategories[1].id },
    { name: 'Nasal Cannula Adult', sku: 'CON-CAN-001', description: 'Disposable oxygen tube for adults, length 2m', price: 15000.0, cost: 5000.0, currentStock: 100, minStock: 15, categoryId: dbCategories[2].id },
  ];

  const dbProducts: any[] = [];
  for (const prod of products) {
    const dbProd = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
    dbProducts.push(dbProd);
  }
  console.log('Products upserted.');

  // 9. Seed some initial transactions & stock movements to make the dashboard alive
  const creatorId = dbUsers['admin@medis24.com'].id;

  // Let's create one initial Purchase (Restock)
  const purchase = await prisma.purchase.create({
    data: {
      invoiceNo: 'PUR-20260701-001',
      vendorId: dbVendors[0].id,
      totalAmount: 2200000.0,
      amountPaid: 2200000.0,
      status: PaymentStatus.PAID,
      createdById: creatorId,
      items: {
        create: [
          { productId: dbProducts[0].id, quantity: 10, unitCost: 210000.0, subtotal: 2100000.0 },
          { productId: dbProducts[2].id, quantity: 20, unitCost: 5000.0, subtotal: 100000.0 },
        ],
      },
    },
  });

  // Log stock movement for the purchase items
  await prisma.stockMovement.createMany({
    data: [
      {
        type: MovementType.IN,
        referenceType: MovementReferenceType.PURCHASE,
        referenceId: purchase.id,
        productId: dbProducts[0].id,
        quantity: 10,
        beforeStock: 15,
        afterStock: 25,
        createdById: creatorId,
      },
      {
        type: MovementType.IN,
        referenceType: MovementReferenceType.PURCHASE,
        referenceId: purchase.id,
        productId: dbProducts[2].id,
        quantity: 20,
        beforeStock: 80,
        afterStock: 100,
        createdById: creatorId,
      },
    ],
  });

  // Log expense for the purchase
  await prisma.expense.create({
    data: {
      category: 'PURCHASE',
      amount: 2200000.0,
      description: 'Restock regulators and cannulas',
      createdById: creatorId,
      date: new Date('2026-07-01'),
    },
  });

  // Let's create one Sale
  const sale = await prisma.sale.create({
    data: {
      invoiceNo: 'SAL-20260702-001',
      customerId: dbCustomers[0].id,
      totalAmount: 380000.0,
      amountPaid: 380000.0,
      paymentMethod: 'CASH',
      status: PaymentStatus.PAID,
      createdById: creatorId,
      items: {
        create: [
          { productId: dbProducts[0].id, quantity: 1, unitPrice: 350000.0, subtotal: 350000.0 },
          { productId: dbProducts[2].id, quantity: 2, unitPrice: 15000.0, subtotal: 30000.0 },
        ],
      },
    },
  });

  // Log stock movements for the sale
  await prisma.stockMovement.createMany({
    data: [
      {
        type: MovementType.OUT,
        referenceType: MovementReferenceType.SALE,
        referenceId: sale.id,
        productId: dbProducts[0].id,
        quantity: 1,
        beforeStock: 25,
        afterStock: 24,
        createdById: creatorId,
      },
      {
        type: MovementType.OUT,
        referenceType: MovementReferenceType.SALE,
        referenceId: sale.id,
        productId: dbProducts[2].id,
        quantity: 2,
        beforeStock: 100,
        afterStock: 98,
        createdById: creatorId,
      },
    ],
  });

  // Log Income for the sale
  await prisma.income.create({
    data: {
      category: 'SALES_REVENUE',
      amount: 380000.0,
      description: 'Sale of 1 regulator and 2 nasal cannulas',
      createdById: creatorId,
      referenceType: MovementReferenceType.SALE,
      referenceId: sale.id,
      date: new Date('2026-07-02'),
    },
  });

  console.log('Seed database completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
