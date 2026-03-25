import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import {
  NotificationQueueService,
} from './notification-queue.service';
import {
  WindowOptimizerService,
} from './window-optimizer.service';
import {
  PendingNotification,
} from '../../database/entities/pending-notification.entity';
import {
  MessageWindowTracking,
} from '../../database/entities/message-window-tracking.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { QUEUE_NAMES } from '../queue/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PendingNotification,
      MessageWindowTracking,
    ]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATION,
    }),
    WhatsappModule,
  ],
  providers: [NotificationQueueService, WindowOptimizerService],
  exports: [NotificationQueueService, WindowOptimizerService],
})
export class NotificationsModule {}
