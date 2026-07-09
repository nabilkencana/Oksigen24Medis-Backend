import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CylinderRepository } from '../repositories/cylinder.repository';
import { OxygenTypeRepository } from '../repositories/oxygen-type.repository';
import { CreateCylinderDto, UpdateCylinderDto } from '../dto/cylinder.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CylindersService {
  constructor(
    private readonly cylinderRepository: CylinderRepository,
    private readonly oxygenTypeRepository: OxygenTypeRepository,
  ) {}

  async create(dto: CreateCylinderDto) {
    const existing = await this.cylinderRepository.findBySerialNumber(dto.serialNumber);
    if (existing) {
      throw new ConflictException(`Cylinder with serial number ${dto.serialNumber} already exists`);
    }

    const oxygenType = await this.oxygenTypeRepository.findById(dto.oxygenTypeId);
    if (!oxygenType) {
      throw new NotFoundException(`OxygenType with ID ${dto.oxygenTypeId} not found`);
    }

    const createData: any = {
      serialNumber: dto.serialNumber,
      capacity: dto.capacity,
      size: dto.size,
      status: dto.status,
      oxygenType: { connect: { id: dto.oxygenTypeId } },
    };

    if (dto.customerId) createData.customerId = dto.customerId;
    if (dto.vendorId) createData.vendor = { connect: { id: dto.vendorId } };

    return this.cylinderRepository.create(createData);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'serialNumber', sortOrder = 'asc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { status: { equals: search.toUpperCase() as any } },
      ];
    }

    const { items, total } = await this.cylinderRepository.findAll({
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
    const item = await this.cylinderRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Cylinder not found');
    }
    return item;
  }

  async update(id: string, dto: UpdateCylinderDto) {
    await this.findById(id);

    const updateData: any = { ...dto };

    if (dto.serialNumber) {
      const existing = await this.cylinderRepository.findBySerialNumber(dto.serialNumber);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Serial number ${dto.serialNumber} already in use by another cylinder`);
      }
    }

    if (dto.oxygenTypeId) {
      const oxygenType = await this.oxygenTypeRepository.findById(dto.oxygenTypeId);
      if (!oxygenType) {
        throw new NotFoundException(`OxygenType with ID ${dto.oxygenTypeId} not found`);
      }
      delete updateData.oxygenTypeId;
      updateData.oxygenType = { connect: { id: dto.oxygenTypeId } };
    }

    if (dto.vendorId) {
      delete updateData.vendorId;
      updateData.vendor = { connect: { id: dto.vendorId } };
    } else if (dto.vendorId === null) {
      updateData.vendor = { disconnect: true };
    }

    return this.cylinderRepository.update(id, updateData);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.cylinderRepository.softDelete(id);
    return { id, message: 'Cylinder soft-deleted successfully' };
  }
}
