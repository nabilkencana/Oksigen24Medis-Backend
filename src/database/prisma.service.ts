import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    let urlWithPool = dbUrl;
    if (dbUrl && !dbUrl.includes('connection_limit')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      urlWithPool = `${dbUrl}${separator}connection_limit=3`;
    }

    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: urlWithPool,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Soft delete helper query middleware or raw extensions can be added if needed,
  // but doing soft-delete queries in the repositories is safer and more transparent.
}
