import { Injectable, Logger } from '@nestjs/common';
import { GptService } from './gpt.service';

export type Intent =
  | 'SCHEDULE_CREATE'
  | 'SCHEDULE_QUERY'
  | 'SCHEDULE_UPDATE'
  | 'SCHEDULE_CANCEL'
  | 'FINANCE_INCOME'
  | 'FINANCE_EXPENSE'
  | 'FINANCE_QUERY'
  | 'BUDGET_CREATE'
  | 'BUDGET_QUERY'
  | 'SERVICE_ORDER_CREATE'
  | 'PROFILE_UPDATE'
  | 'PROFILE_QUERY'
  | 'LOGO_UPLOAD_REQUEST'
  | 'LANGUAGE_CHANGE'
  | 'GENERAL_QUERY'
  | 'ONBOARDING'
  | 'UNKNOWN';

export interface ClassifiedIntent {
  intent: Intent;
  confidence: number;
  extractedData: Record<string, unknown>;
  responseText: string;
}

const CLASSIFICATION_PROMPT = `You are an intent classifier for BossZap, a business management AI assistant.

Classify the user's message into ONE of these intents:
- SCHEDULE_CREATE: Creating a new appointment/event
- SCHEDULE_QUERY: Asking about existing appointments
- SCHEDULE_UPDATE: Changing an existing appointment
- SCHEDULE_CANCEL: Cancelling an appointment
- FINANCE_INCOME: Registering money received
- FINANCE_EXPENSE: Registering money spent
- FINANCE_QUERY: Asking about financial data
- BUDGET_CREATE: Creating a new quote/budget
- BUDGET_QUERY: Asking about existing quotes
- SERVICE_ORDER_CREATE: Creating a service order
- PROFILE_UPDATE: Updating business profile info
- LANGUAGE_CHANGE: Changing preferred language
- GENERAL_QUERY: General questions about the system

Extract structured data when possible (dates, amounts, names, descriptions).

Respond in JSON format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.0-1.0,
  "extracted_data": { ... },
  "needs_clarification": false,
  "clarification_question": ""
}`;

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  constructor(private readonly gpt: GptService) {}

  async classify(
    text: string,
    language: string,
    context: Array<{ role: string; content: string }>,
  ): Promise<ClassifiedIntent> {
    try {
      const messages = [
        { role: 'system' as const, content: CLASSIFICATION_PROMPT },
        ...context.slice(-5).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: text },
      ];

      const response = await this.gpt.chat(messages);

      const parsed = this.parseClassification(response.content);
      this.logger.log(
        `Classified: ${parsed.intent} ` + `(${parsed.confidence})`,
      );
      return parsed;
    } catch (error) {
      this.logger.error(
        'Classification failed',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        extractedData: {},
        responseText: '',
      };
    }
  }

  private parseClassification(raw: string): ClassifiedIntent {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          intent: 'UNKNOWN',
          confidence: 0,
          extractedData: {},
          responseText: '',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        intent: string;
        confidence: number;
        extracted_data?: Record<string, unknown>;
        needs_clarification?: boolean;
        clarification_question?: string;
      };

      return {
        intent: (parsed.intent || 'UNKNOWN') as Intent,
        confidence: parsed.confidence || 0,
        extractedData: parsed.extracted_data || {},
        responseText: parsed.needs_clarification
          ? parsed.clarification_question || ''
          : '',
      };
    } catch {
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        extractedData: {},
        responseText: '',
      };
    }
  }
}
