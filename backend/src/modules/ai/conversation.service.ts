import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConversationHistory } from '../../database/entities/conversation-history.entity';

const MAX_CONTEXT_MESSAGES = 20;
const CONTEXT_TIMEOUT_MS = 30 * 60 * 1000;

interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationHistory)
    private readonly historyRepo: Repository<ConversationHistory>,
  ) {}

  async getContext(subscriberId: string): Promise<ContextMessage[]> {
    const cutoff = new Date(Date.now() - CONTEXT_TIMEOUT_MS);

    const messages = await this.historyRepo.find({
      where: {
        subscriber_id: subscriberId,
        created_at: MoreThan(cutoff),
      },
      order: { created_at: 'DESC' },
      take: MAX_CONTEXT_MESSAGES,
    });

    return messages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  async saveMessage(
    subscriberId: string,
    role: 'user' | 'assistant',
    content: string,
    intent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.historyRepo.save({
      subscriber_id: subscriberId,
      role,
      content,
      intent,
      metadata,
    });
  }

  /**
   * Returns the most recent assistant message for a subscriber, optionally
   * constrained to a time window. Used by the inbound processor to detect
   * follow-up image uploads (e.g. user sent the logo right after the AI
   * asked for it).
   */
  async getLastAssistantMessage(
    subscriberId: string,
    sinceMinutes = 10,
  ): Promise<ConversationHistory | null> {
    const cutoff = new Date(Date.now() - sinceMinutes * 60 * 1000);
    const message = await this.historyRepo.findOne({
      where: {
        subscriber_id: subscriberId,
        role: 'assistant',
        created_at: MoreThan(cutoff),
      },
      order: { created_at: 'DESC' },
    });
    return message ?? null;
  }

  /**
   * Returns the extracted_data of the most recent BUDGET_PREVIEW message
   * within the given time window. Used by the orchestrator to retrieve
   * pending budget details when the user confirms PDF generation.
   */
  async getLastPendingBudget(
    subscriberId: string,
    withinMinutes = 30,
  ): Promise<Record<string, unknown> | null> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const message = await this.historyRepo.findOne({
      where: {
        subscriber_id: subscriberId,
        role: 'assistant',
        intent: 'BUDGET_PREVIEW',
        created_at: MoreThan(cutoff),
      },
      order: { created_at: 'DESC' },
    });
    if (!message?.metadata) return null;
    return (
      (message.metadata as { pending_budget?: Record<string, unknown> })
        .pending_budget ?? null
    );
  }
}
