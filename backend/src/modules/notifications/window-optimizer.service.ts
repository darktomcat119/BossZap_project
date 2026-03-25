import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  MessageWindowTracking,
} from '../../database/entities/message-window-tracking.entity';

const WINDOW_DURATION_HOURS = 24;

@Injectable()
export class WindowOptimizerService {
  private readonly logger = new Logger(
    WindowOptimizerService.name,
  );

  constructor(
    @InjectRepository(MessageWindowTracking)
    private readonly windowRepo: Repository<MessageWindowTracking>,
  ) {}

  async updateWindow(subscriberId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + WINDOW_DURATION_HOURS * 60 * 60 * 1000,
    );

    const existing = await this.windowRepo.findOne({
      where: { subscriber_id: subscriberId },
    });

    if (existing) {
      await this.windowRepo.update(existing.id, {
        last_inbound_at: now,
        window_expires_at: expiresAt,
      });
    } else {
      await this.windowRepo.save(
        this.windowRepo.create({
          subscriber_id: subscriberId,
          last_inbound_at: now,
          window_expires_at: expiresAt,
        }),
      );
    }

    this.logger.debug(
      `Window updated for ${subscriberId}, ` +
        `expires at ${expiresAt.toISOString()}`,
    );
  }

  async isWindowOpen(subscriberId: string): Promise<boolean> {
    const tracking = await this.windowRepo.findOne({
      where: { subscriber_id: subscriberId },
    });

    if (!tracking) {
      return false;
    }

    return new Date() < tracking.window_expires_at;
  }

  async getWindowExpiry(
    subscriberId: string,
  ): Promise<Date | null> {
    const tracking = await this.windowRepo.findOne({
      where: { subscriber_id: subscriberId },
    });

    if (!tracking) {
      return null;
    }

    return tracking.window_expires_at;
  }

  async getSubscribersWithOpenWindows(): Promise<string[]> {
    const now = new Date();
    const records = await this.windowRepo.find({
      where: {
        window_expires_at: LessThan(now) as never,
      },
      select: ['subscriber_id'],
    });

    return records.map((r) => r.subscriber_id);
  }

  async getExpiredWindows(): Promise<MessageWindowTracking[]> {
    const now = new Date();
    return this.windowRepo
      .createQueryBuilder('w')
      .where('w.window_expires_at < :now', { now })
      .getMany();
  }
}
