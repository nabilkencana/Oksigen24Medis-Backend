import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Find the role in the database
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: createUserDto.role },
    });

    if (!roleRecord) {
      throw new NotFoundException(`Role ${createUserDto.role} not found in system`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      fullName: createUserDto.fullName,
      role: { connect: { id: roleRecord.id } },
      isActive: true,
    });

    // Exclude password from response
    const { passwordHash: _, refreshTokenHash: __, ...result } = user as any;
    return result;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { users, total } = await this.usersRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const sanitizedUsers = users.map((user) => {
      const { passwordHash: _, refreshTokenHash: __, ...result } = user as any;
      return result;
    });

    return {
      items: sanitizedUsers,
      meta: {
        totalItems: total,
        itemCount: sanitizedUsers.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _, refreshTokenHash: __, ...result } = user as any;
    return result;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id); // Ensure user exists

    const updateData: any = {};
    if (updateUserDto.fullName) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;

    if (updateUserDto.email) {
      const existing = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use by another user');
      }
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role) {
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: updateUserDto.role },
      });
      if (!roleRecord) {
        throw new NotFoundException(`Role ${updateUserDto.role} not found`);
      }
      updateData.role = { connect: { id: roleRecord.id } };
    }

    const updatedUser = await this.usersRepository.update(id, updateData);
    const { passwordHash: _, refreshTokenHash: __, ...result } = updatedUser as any;
    return result;
  }

  async remove(id: string) {
    await this.findById(id); // Ensure user exists
    await this.usersRepository.softDelete(id);
    return { id, message: 'User soft-deleted successfully' };
  }
}
