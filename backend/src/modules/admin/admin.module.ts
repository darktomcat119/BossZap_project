import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Subscriber,
  Plan,
  Subscription,
  Payment,
  UsageTracking,
  AuditLog,
  HsmTemplate,
  ConversationHistory,
} from '../../database/entities';
import { AdminSubscribersController } from './admin-subscribers.controller';
import { AdminSubscribersService } from './admin-subscribers.service';
import { AdminPlansController } from './admin-plans.controller';
import { AdminPlansService } from './admin-plans.service';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminLogsController } from './admin-logs.controller';
import { AdminLogsService } from './admin-logs.service';
import { AdminHsmController } from './admin-hsm.controller';
import { AdminHsmService } from './admin-hsm.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscriber,
      Plan,
      Subscription,
      Payment,
      UsageTracking,
      AuditLog,
      HsmTemplate,
      ConversationHistory,
    ]),
  ],
  controllers: [
    AdminSubscribersController,
    AdminPlansController,
    AdminMetricsController,
    AdminLogsController,
    AdminHsmController,
    AdminPaymentsController,
  ],
  providers: [
    AdminSubscribersService,
    AdminPlansService,
    AdminMetricsService,
    AdminLogsService,
    AdminHsmService,
    AdminPaymentsService,
  ],
  exports: [
    AdminSubscribersService,
    AdminPlansService,
    AdminMetricsService,
    AdminLogsService,
    AdminHsmService,
    AdminPaymentsService,
  ],
})
export class AdminModule {}
