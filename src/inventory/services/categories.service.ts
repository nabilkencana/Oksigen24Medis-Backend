import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }
    return this.categoryRepository.create(dto);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.categoryRepository.findAll({
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
    const item = await this.categoryRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Category not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id); // Ensure exists

    if (dto.name) {
      const existing = await this.categoryRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.categoryRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.categoryRepository.softDelete(id);
    return { id, message: 'Category soft-deleted successfully' };
  }
}
