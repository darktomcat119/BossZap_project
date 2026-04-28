import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/constants';
import { AdminHealthController } from './admin-health.controller';
import { AdminHealthService } from './admin-health.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import {
  Subscriber,
  Plan,
  Subscription,
  Payment,
  UsageTracking,
  AuditLog,
  HsmTemplate,
  ConversationHistory,
  AdminUser,
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
      AdminUser,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.WHATSAPP_INBOUND },
      { name: QUEUE_NAMES.WHATSAPP_OUTBOUND },
    ),
  ],
  controllers: [
    AdminHealthController,
    AdminNotificationsController,
    AdminProfileController,
    AdminSubscribersController,
    AdminPlansController,
    AdminMetricsController,
    AdminLogsController,
    AdminHsmController,
    AdminPaymentsController,
  ],
  providers: [
    AdminHealthService,
    AdminNotificationsService,
    AdminProfileService,
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
