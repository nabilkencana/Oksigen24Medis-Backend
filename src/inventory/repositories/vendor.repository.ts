import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Vendor } from '@prisma/client';

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.VendorWhereInput;
    orderBy?: Prisma.VendorOrderByWithRelationInput;
  }): Promise<{ items: Vendor[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const baseWhere = { deletedAt: null, ...where };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        skip,
        take,
        where: baseWhere,
        orderBy,
      }),
      this.prisma.vendor.count({ where: baseWhere }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.VendorUpdateInput): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
