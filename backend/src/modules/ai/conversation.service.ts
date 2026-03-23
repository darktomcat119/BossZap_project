import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  ConversationHistory,
} from '../../database/entities/conversation-history.entity';

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

  async getContext(
    subscriberId: string,
  ): Promise<ContextMessage[]> {
    const cutoff = new Date(
      Date.now() - CONTEXT_TIMEOUT_MS,
    );

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
}
