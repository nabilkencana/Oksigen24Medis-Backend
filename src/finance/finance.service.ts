import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExpenseDto, CreateIncomeDto } from './dto/finance.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(dto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        date: dto.date || new Date(),
        createdById: userId,
      },
    });
  }

  async createIncome(dto: CreateIncomeDto, userId: string) {
    return this.prisma.income.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        date: dto.date || new Date(),
        createdById: userId,
      },
    });
  }

  async findAllExpenses(queryDto: FinanceQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { createdBy: true },
      }),
      this.prisma.expense.count({ where }),
    ]);

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

  async findAllIncomes(queryDto: FinanceQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.income.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { createdBy: true },
      }),
      this.prisma.income.count({ where }),
    ]);

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

  async getCashFlowSummary(queryDto: FinanceQueryDto) {
    const { startDate, endDate } = queryDto;
    const where: any = { deletedAt: null };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Compute sums using prisma aggregation
    const [incomeAggregate, expenseAggregate] = await Promise.all([
      this.prisma.income.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeAggregate._sum.amount || 0);
    const totalExpense = Number(expenseAggregate._sum.amount || 0);
    const netProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      startDate: startDate || null,
      endDate: endDate || null,
    };
  }
}
