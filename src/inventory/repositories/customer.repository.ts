import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Customer } from '@prisma/client';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<{ items: Customer[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const baseWhere = { deletedAt: null, ...where };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        skip,
        take,
        where: baseWhere,
        orderBy,
      }),
      this.prisma.customer.count({ where: baseWhere }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(
    id: string,
    data: Prisma.CustomerUpdateInput,
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
