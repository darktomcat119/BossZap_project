import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WhatsappService } from './whatsapp.service';
import { MediaService } from './media.service';
import { WindowTrackerService } from './window-tracker.service';
import {
  MessageWindowTracking,
} from '../../database/entities/message-window-tracking.entity';
import {
  PendingNotification,
} from '../../database/entities/pending-notification.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { QUEUE_NAMES } from '../queue/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageWindowTracking,
      PendingNotification,
      Subscriber,
    ]),
    BullModule.registerQueue({ name: QUEUE_NAMES.WHATSAPP_INBOUND }),
    BullModule.registerQueue({ name: QUEUE_NAMES.WHATSAPP_OUTBOUND }),
  ],
  controllers: [WebhookController],
  providers: [WhatsappService, MediaService, WindowTrackerService],
  exports: [WhatsappService, MediaService, WindowTrackerService],
})
export class WhatsappModule {}
