import { Module } from '@nestjs/common';

// Repositories
import { CategoryRepository } from './repositories/category.repository';
import { CustomerRepository } from './repositories/customer.repository';
import { VendorRepository } from './repositories/vendor.repository';
import { ProductRepository } from './repositories/product.repository';
import { OxygenTypeRepository } from './repositories/oxygen-type.repository';
import { CylinderRepository } from './repositories/cylinder.repository';

// Services
import { CategoriesService } from './services/categories.service';
import { CustomersService } from './services/customers.service';
import { VendorsService } from './services/vendors.service';
import { ProductsService } from './services/products.service';
import { OxygenTypesService } from './services/oxygen-types.service';
import { CylindersService } from './services/cylinders.service';

// Controllers
import { CategoriesController } from './controllers/categories.controller';
import { CustomersController } from './controllers/customers.controller';
import { VendorsController } from './controllers/vendors.controller';
import { ProductsController } from './controllers/products.controller';
import { OxygenTypesController } from './controllers/oxygen-types.controller';
import { CylindersController } from './controllers/cylinders.controller';

@Module({
  controllers: [
    CategoriesController,
    CustomersController,
    VendorsController,
    ProductsController,
    OxygenTypesController,
    CylindersController,
  ],
  providers: [
    // Repositories
    CategoryRepository,
    CustomerRepository,
    VendorRepository,
    ProductRepository,
    OxygenTypeRepository,
    CylinderRepository,
    // Services
    CategoriesService,
    CustomersService,
    VendorsService,
    ProductsService,
    OxygenTypesService,
    CylindersService,
  ],
  exports: [
    // Export repositories and services so they can be injected into Transactions & Dashboard modules
    CategoryRepository,
    CustomerRepository,
    VendorRepository,
    ProductRepository,
    OxygenTypeRepository,
    CylinderRepository,
    CategoriesService,
    CustomersService,
    VendorsService,
    ProductsService,
    OxygenTypesService,
    CylindersService,
  ],
})
export class InventoryModule {}
