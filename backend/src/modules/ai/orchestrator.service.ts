import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GptService } from './gpt.service';
import { ConversationService } from './conversation.service';
import { IntentClassifierService, Intent } from './intent-classifier.service';
import { OnboardingService } from './onboarding.service';
import { ActionExecutorService } from './action-executor.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import {
  UsageTracking,
} from '../../database/entities/usage-tracking.entity';
import { getSystemPrompt } from './prompts/system-prompt';

interface ProcessMessageInput {
  subscriberId: string;
  phone: string;
  text: string;
  messageType: string;
  mediaId?: string;
  contactName?: string;
}

interface ProcessMessageResult {
  intent: Intent;
  responseText: string;
  extractedData: Record<string, unknown>;
  actionTaken: string;
}

interface GptActionResponse {
  intent: string;
  extracted_data: Record<string, unknown>;
  response_text: string;
  action_required: boolean;
  action_type: string;
}

const SUSPENDED_MESSAGES: Record<string, string> = {
  es: 'Tu cuenta está suspendida. Por favor actualiza tu pago para continuar usando BossZap.',
  en: 'Your account is suspended. Please update your payment to continue using BossZap.',
  'pt-BR': 'Sua conta está suspensa. Por favor atualize seu pagamento para continuar usando o BossZap.',
};

const ERROR_MESSAGES: Record<string, string> = {
  es: 'Estoy teniendo dificultades, intenta de nuevo en un momento.',
  en: "I'm having trouble, try again in a moment.",
  'pt-BR': 'Estou com dificuldades, tente novamente em um momento.',
};

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(
    OrchestratorService.name,
  );

  constructor(
    private readonly gpt: GptService,
    private readonly conversation: ConversationService,
    private readonly intentClassifier: IntentClassifierService,
    private readonly onboarding: OnboardingService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly subscribers: SubscribersService,
    @InjectRepository(UsageTracking)
    private readonly usageRepo: Repository<UsageTracking>,
  ) {}

  async processMessage(
    input: ProcessMessageInput,
  ): Promise<ProcessMessageResult> {
    const { subscriberId, phone, text, contactName } = input;

    try {
      const subscriber =
        await this.subscribers.findById(subscriberId);
      const language = subscriber.preferred_language || 'es';

      if (subscriber.status === 'suspended') {
        return {
          intent: 'GENERAL_QUERY',
          responseText:
            SUSPENDED_MESSAGES[language] ||
            SUSPENDED_MESSAGES.es,
          extractedData: {},
          actionTaken: 'none',
        };
      }

      if (subscriber.status === 'onboarding') {
        const result =
          await this.onboarding.processOnboarding(
            subscriberId,
            phone,
            text,
            contactName,
          );
        return {
          intent: 'ONBOARDING',
          responseText: result.responseText,
          extractedData: {},
          actionTaken: result.isComplete
            ? 'onboarding_complete'
            : 'onboarding_step',
        };
      }

      const withinLimits =
        await this.checkUsageLimits(subscriberId);
      if (!withinLimits) {
        return this.limitReachedResponse(language);
      }

      const context =
        await this.conversation.getContext(subscriberId);

      await this.conversation.saveMessage(
        subscriberId,
        'user',
        text,
      );

      const systemPrompt = getSystemPrompt(
        language,
        subscriber.owner_name || '',
        subscriber.business_name || '',
      );

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...context.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: text },
      ];

      const response =
        await this.gpt.chatWithRetry(messages);
      const parsed = this.parseResponse(response.content);

      if (parsed.action_required && parsed.action_type !== 'none') {
        const actionResult = await this.actionExecutor.execute(
          subscriberId,
          parsed.intent,
          parsed.extracted_data || {},
          language,
        );

        if (!actionResult.success) {
          this.logger.warn(
            `Action ${parsed.intent} failed: ` +
              `${actionResult.error}`,
          );
        }
      }

      await this.conversation.saveMessage(
        subscriberId,
        'assistant',
        parsed.response_text,
        parsed.intent,
      );

      await this.incrementUsage(subscriberId);

      return {
        intent: parsed.intent as Intent,
        responseText: parsed.response_text,
        extractedData: parsed.extracted_data || {},
        actionTaken: parsed.action_type || 'none',
      };
    } catch (error) {
      this.logger.error(
        `Error processing message for ${subscriberId}`,
        error instanceof Error ? error.stack : String(error),
      );

      const subscriber = await this.subscribers
        .findById(subscriberId)
        .catch(() => null);
      const lang =
        subscriber?.preferred_language || 'es';

      return {
        intent: 'UNKNOWN',
        responseText:
          ERROR_MESSAGES[lang] || ERROR_MESSAGES.es,
        extractedData: {},
        actionTaken: 'error',
      };
    }
  }

  private parseResponse(raw: string): GptActionResponse {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          intent: 'GENERAL_QUERY',
          extracted_data: {},
          response_text: raw,
          action_required: false,
          action_type: 'none',
        };
      }
      return JSON.parse(
        jsonMatch[0],
      ) as GptActionResponse;
    } catch {
      return {
        intent: 'GENERAL_QUERY',
        extracted_data: {},
        response_text: raw,
        action_required: false,
        action_type: 'none',
      };
    }
  }

  private async checkUsageLimits(
    subscriberId: string,
  ): Promise<boolean> {
    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const monthStr = monthStart.toISOString().split('T')[0];

    const usage = await this.usageRepo.findOne({
      where: {
        subscriber_id: subscriberId,
        month: monthStr,
      },
    });

    if (!usage) return true;

    const subscriber =
      await this.subscribers.findById(subscriberId);
    if (!subscriber.plan) return true;

    const plan = subscriber.plan;
    if (usage.ai_calls_count >= plan.max_ai_calls_per_month) {
      return false;
    }
    if (usage.messages_count >= plan.max_messages_per_month) {
      return false;
    }

    return true;
  }

  private async incrementUsage(
    subscriberId: string,
  ): Promise<void> {
    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const monthStr = monthStart.toISOString().split('T')[0];

    await this.usageRepo.upsert(
      {
        subscriber_id: subscriberId,
        month: monthStr,
        messages_count: () => 'messages_count + 1',
        ai_calls_count: () => 'ai_calls_count + 1',
      } as any,
      {
        conflictPaths: ['subscriber_id', 'month'],
      },
    );
  }

  private limitReachedResponse(
    language: string,
  ): ProcessMessageResult {
    const messages: Record<string, string> = {
      es: 'Has alcanzado el límite de tu plan este mes. Actualiza tu plan para seguir usando BossZap sin interrupciones.',
      en: "You've reached your plan limit this month. Upgrade your plan to keep using BossZap without interruption.",
      'pt-BR': 'Você atingiu o limite do seu plano este mês. Atualize seu plano para continuar usando o BossZap sem interrupções.',
    };

    return {
      intent: 'GENERAL_QUERY',
      responseText: messages[language] || messages.es,
      extractedData: {},
      actionTaken: 'limit_reached',
    };
  }
}
