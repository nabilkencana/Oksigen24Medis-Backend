import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Cylinder } from '@prisma/client';

@Injectable()
export class CylinderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CylinderCreateInput): Promise<Cylinder> {
    return this.prisma.cylinder.create({
      data,
      include: { oxygenType: true, vendor: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CylinderWhereInput;
    orderBy?: Prisma.CylinderOrderByWithRelationInput;
  }): Promise<{ items: Cylinder[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const baseWhere = { deletedAt: null, ...where };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cylinder.findMany({
        skip,
        take,
        where: baseWhere,
        orderBy,
        include: { oxygenType: true, vendor: true },
      }),
      this.prisma.cylinder.count({ where: baseWhere }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Cylinder | null> {
    return this.prisma.cylinder.findFirst({
      where: { id, deletedAt: null },
      include: { oxygenType: true, vendor: true },
    });
  }

  async findBySerialNumber(serialNumber: string): Promise<Cylinder | null> {
    return this.prisma.cylinder.findFirst({
      where: { serialNumber, deletedAt: null },
      include: { oxygenType: true, vendor: true },
    });
  }

  async update(
    id: string,
    data: Prisma.CylinderUpdateInput,
  ): Promise<Cylinder> {
    return this.prisma.cylinder.update({
      where: { id },
      data,
      include: { oxygenType: true, vendor: true },
    });
  }

  async softDelete(id: string): Promise<Cylinder> {
    return this.prisma.cylinder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
