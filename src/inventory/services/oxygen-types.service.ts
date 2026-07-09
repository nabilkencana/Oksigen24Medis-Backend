import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OxygenTypeRepository } from '../repositories/oxygen-type.repository';
import { CreateOxygenTypeDto, UpdateOxygenTypeDto } from '../dto/oxygen-type.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OxygenTypesService {
  constructor(private readonly oxygenTypeRepository: OxygenTypeRepository) {}

  async create(dto: CreateOxygenTypeDto) {
    const existing = await this.oxygenTypeRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Oxygen type with this name already exists');
    }
    return this.oxygenTypeRepository.create(dto);
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

    const { items, total } = await this.oxygenTypeRepository.findAll({
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
    const item = await this.oxygenTypeRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Oxygen type not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateOxygenTypeDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.oxygenTypeRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Oxygen type with this name already exists');
      }
    }

    return this.oxygenTypeRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.oxygenTypeRepository.softDelete(id);
    return { id, message: 'Oxygen type soft-deleted successfully' };
  }
}
