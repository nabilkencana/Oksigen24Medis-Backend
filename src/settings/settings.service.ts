import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateSettingDto } from './dto/company-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.companySetting.findMany();
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async updateSetting(dto: UpdateSettingDto) {
    return this.prisma.companySetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value },
      create: {
        key: dto.key,
        value: dto.value,
        description: `Custom system configuration for ${dto.key}`,
      },
    });
  }
}
