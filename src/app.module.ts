import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Custom configuration and validation
import configuration from './config/configuration';
import { validate } from './config/env.validation';

// Core Database Module
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FinanceModule } from './finance/finance.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import { NotificationsModule } from './common/notifications/notifications.module';


@Module({
  imports: [
    // Environment Configurations
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') || 60000,
          limit: config.get<number>('throttle.limit') || 100,
        },
      ],
    }),

    // Database Module
    DatabaseModule,

    // App Feature Modules
    AuthModule,
    UsersModule,
    DashboardModule,
    InventoryModule,
    TransactionsModule,
    FinanceModule,
    ReportsModule,
    SettingsModule,
    RealtimeModule,
    NotificationsModule,
  ],
})
export class AppModule {}
