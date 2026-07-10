import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from '../repositories/customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(dto: CreateCustomerDto) {
    return this.customerRepository.create(dto);
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

    const { items, total } = await this.customerRepository.findAll({
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
    const item = await this.customerRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Customer not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findById(id);
    return this.customerRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.customerRepository.softDelete(id);
    return { id, message: 'Customer soft-deleted successfully' };
  }
}
