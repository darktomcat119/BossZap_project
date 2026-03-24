import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
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
import { LoggerService } from './config/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          __dirname +
            '/database/entities/**/*.entity{.ts,.js}',
        ],
        migrations: [
          __dirname + '/database/migrations/*{.ts,.js}',
        ],
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
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule {}
