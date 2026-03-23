import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './constants';
import { InboundProcessor } from './processors/inbound.processor';
import { OutboundProcessor } from './processors/outbound.processor';
import { AiModule } from '../ai/ai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.WHATSAPP_INBOUND },
      { name: QUEUE_NAMES.WHATSAPP_OUTBOUND },
    ),
    AiModule,
    WhatsappModule,
    SubscribersModule,
  ],
  providers: [InboundProcessor, OutboundProcessor],
})
export class QueueModule {}
