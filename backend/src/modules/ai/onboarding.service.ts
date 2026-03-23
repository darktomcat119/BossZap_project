import { Injectable, Logger } from '@nestjs/common';
import { GptService } from './gpt.service';
import { ConversationService } from './conversation.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { getOnboardingPrompt } from './prompts/system-prompt';

interface OnboardingResult {
  responseText: string;
  isComplete: boolean;
}

interface OnboardingGptResponse {
  step: string;
  collected_data: Record<string, string>;
  response_text: string;
  is_complete: boolean;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly gpt: GptService,
    private readonly conversation: ConversationService,
    private readonly subscribers: SubscribersService,
  ) {}

  async processOnboarding(
    subscriberId: string,
    phone: string,
    text: string,
    contactName?: string,
  ): Promise<OnboardingResult> {
    const subscriber =
      await this.subscribers.findById(subscriberId);
    const language = subscriber.preferred_language || 'es';
    const context =
      await this.conversation.getContext(subscriberId);

    await this.conversation.saveMessage(
      subscriberId,
      'user',
      text,
      'ONBOARDING',
    );

    const systemPrompt = getOnboardingPrompt(language);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: text },
    ];

    if (context.length === 0 && contactName) {
      messages.push({
        role: 'system' as const,
        content:
          `The user's WhatsApp name is "${contactName}". ` +
          `Use this as a hint for the owner name.`,
      });
    }

    const response = await this.gpt.chatWithRetry(messages);

    const parsed = this.parseOnboardingResponse(
      response.content,
    );

    if (parsed.is_complete) {
      await this.completeOnboarding(
        subscriberId,
        parsed.collected_data,
      );
    } else {
      await this.updatePartialData(
        subscriberId,
        parsed.collected_data,
      );
    }

    await this.conversation.saveMessage(
      subscriberId,
      'assistant',
      parsed.response_text,
      'ONBOARDING',
    );

    return {
      responseText: parsed.response_text,
      isComplete: parsed.is_complete,
    };
  }

  private async completeOnboarding(
    subscriberId: string,
    data: Record<string, string>,
  ): Promise<void> {
    await this.subscribers.update(subscriberId, {
      business_name: data.business_name || null,
      owner_name: data.owner_name || null,
      email: data.email || null,
      address: data.address || null,
      status: 'active',
      onboarding_completed_at: new Date(),
    });

    this.logger.log(
      `Onboarding completed for ${subscriberId}`,
    );
  }

  private async updatePartialData(
    subscriberId: string,
    data: Record<string, string>,
  ): Promise<void> {
    const update: Record<string, string | null> = {};

    if (data.business_name) {
      update.business_name = data.business_name;
    }
    if (data.owner_name) {
      update.owner_name = data.owner_name;
    }
    if (data.email) {
      update.email = data.email;
    }
    if (data.address) {
      update.address = data.address;
    }
    if (data.preferred_language) {
      update.preferred_language = data.preferred_language;
    }

    if (Object.keys(update).length > 0) {
      await this.subscribers.update(subscriberId, update);
    }
  }

  private parseOnboardingResponse(
    raw: string,
  ): OnboardingGptResponse {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          step: 'unknown',
          collected_data: {},
          response_text: raw,
          is_complete: false,
        };
      }
      return JSON.parse(jsonMatch[0]) as OnboardingGptResponse;
    } catch {
      return {
        step: 'unknown',
        collected_data: {},
        response_text: raw,
        is_complete: false,
      };
    }
  }
}
