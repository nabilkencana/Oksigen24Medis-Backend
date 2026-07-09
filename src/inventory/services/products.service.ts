import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(dto: CreateProductDto) {
    const existing = await this.productRepository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    return this.productRepository.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      price: dto.price,
      cost: dto.cost,
      currentStock: dto.currentStock,
      minStock: dto.minStock,
      category: { connect: { id: dto.categoryId } },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.productRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string) {
    const item = await this.productRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Product not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    const updateData: any = { ...dto };

    if (dto.sku) {
      const existing = await this.productRepository.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException(`SKU ${dto.sku} already in use by another product`);
      }
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
      delete updateData.categoryId;
      updateData.category = { connect: { id: dto.categoryId } };
    }

    return this.productRepository.update(id, updateData);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.productRepository.softDelete(id);
    return { id, message: 'Product soft-deleted successfully' };
  }
}
