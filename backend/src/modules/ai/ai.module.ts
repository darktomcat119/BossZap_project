import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorService } from './orchestrator.service';
import { IntentClassifierService } from './intent-classifier.service';
import { OnboardingService } from './onboarding.service';
import { ConversationService } from './conversation.service';
import { ActionExecutorService } from './action-executor.service';
import { GptService } from './gpt.service';
import { ConversationHistory } from '../../database/entities/conversation-history.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { UsageTracking } from '../../database/entities/usage-tracking.entity';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { AgendaModule } from '../agenda/agenda.module';
import { FinancialModule } from '../financial/financial.module';
import { BudgetModule } from '../budget/budget.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationHistory, Subscriber, UsageTracking]),
    SubscribersModule,
    forwardRef(() => AgendaModule),
    forwardRef(() => FinancialModule),
    forwardRef(() => BudgetModule),
    forwardRef(() => AnalyticsModule),
  ],
  providers: [
    OrchestratorService,
    IntentClassifierService,
    OnboardingService,
    ConversationService,
    ActionExecutorService,
    GptService,
  ],
  exports: [OrchestratorService, ConversationService],
})
export class AiModule {}
