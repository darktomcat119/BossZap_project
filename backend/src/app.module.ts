import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { HealthModule } from './modules/health/health.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AiModule } from './modules/ai/ai.module';
import { QueueModule } from './modules/queue/queue.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { BudgetModule } from './modules/budget/budget.module';
import { FinancialModule } from './modules/financial/financial.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SubscriberCategoriesModule } from './modules/subscriber-categories/subscriber-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { LoggerService } from './config/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
      { name: 'long', ttl: 3_600_000, limit: 1000 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/database/entities/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    AuthModule,
    SubscribersModule,
    HealthModule,
    WhatsappModule,
    AiModule,
    QueueModule,
    AgendaModule,
    BudgetModule,
    FinancialModule,
    AnalyticsModule,
    WebsocketModule,
    AdminModule,
    PaymentsModule,
    NotificationsModule,
    SubscriberCategoriesModule,
    ProductsModule,
  ],
  providers: [LoggerService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [LoggerService],
})
export class AppModule {}
