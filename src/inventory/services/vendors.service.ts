import { Injectable, NotFoundException } from '@nestjs/common';
import { VendorRepository } from '../repositories/vendor.repository';
import { CreateVendorDto, UpdateVendorDto } from '../dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly vendorRepository: VendorRepository) {}

  async create(dto: CreateVendorDto) {
    return this.vendorRepository.create(dto);
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.vendorRepository.findAll({
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
    const item = await this.vendorRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Vendor not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateVendorDto) {
    await this.findById(id);
    return this.vendorRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.vendorRepository.softDelete(id);
    return { id, message: 'Vendor soft-deleted successfully' };
  }
}
