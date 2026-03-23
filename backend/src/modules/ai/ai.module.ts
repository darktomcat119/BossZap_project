import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorService } from './orchestrator.service';
import { IntentClassifierService } from './intent-classifier.service';
import { OnboardingService } from './onboarding.service';
import { ConversationService } from './conversation.service';
import { GptService } from './gpt.service';
import {
  ConversationHistory,
} from '../../database/entities/conversation-history.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import {
  UsageTracking,
} from '../../database/entities/usage-tracking.entity';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationHistory,
      Subscriber,
      UsageTracking,
    ]),
    SubscribersModule,
  ],
  providers: [
    OrchestratorService,
    IntentClassifierService,
    OnboardingService,
    ConversationService,
    GptService,
  ],
  exports: [OrchestratorService],
})
export class AiModule {}
