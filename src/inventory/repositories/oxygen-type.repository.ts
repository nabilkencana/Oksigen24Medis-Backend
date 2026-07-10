import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, OxygenType } from '@prisma/client';

@Injectable()
export class OxygenTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OxygenTypeCreateInput): Promise<OxygenType> {
    return this.prisma.oxygenType.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OxygenTypeWhereInput;
    orderBy?: Prisma.OxygenTypeOrderByWithRelationInput;
  }): Promise<{ items: OxygenType[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const baseWhere = { deletedAt: null, ...where };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.oxygenType.findMany({
        skip,
        take,
        where: baseWhere,
        orderBy,
      }),
      this.prisma.oxygenType.count({ where: baseWhere }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<OxygenType | null> {
    return this.prisma.oxygenType.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<OxygenType | null> {
    return this.prisma.oxygenType.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async update(
    id: string,
    data: Prisma.OxygenTypeUpdateInput,
  ): Promise<OxygenType> {
    return this.prisma.oxygenType.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<OxygenType> {
    return this.prisma.oxygenType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
