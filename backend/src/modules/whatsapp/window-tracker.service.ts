import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageWindowTracking } from '../../database/entities/message-window-tracking.entity';
import { PendingNotification } from '../../database/entities/pending-notification.entity';

const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000;

interface QueueNotificationInput {
  subscriberId: string;
  type: string;
  priority: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class WindowTrackerService {
  private readonly logger = new Logger(WindowTrackerService.name);

  constructor(
    @InjectRepository(MessageWindowTracking)
    private readonly windowRepo: Repository<MessageWindowTracking>,
    @InjectRepository(PendingNotification)
    private readonly notificationRepo: Repository<PendingNotification>,
  ) {}

  async updateWindow(subscriberId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + WINDOW_DURATION_MS);

    await this.windowRepo.upsert(
      {
        subscriber_id: subscriberId,
        last_inbound_at: now,
        window_expires_at: expiresAt,
      },
      { conflictPaths: ['subscriber_id'] },
    );

    this.logger.debug(
      `Window updated for ${subscriberId}, ` +
        `expires ${expiresAt.toISOString()}`,
    );
  }

  async isWindowOpen(subscriberId: string): Promise<boolean> {
    const tracking = await this.windowRepo.findOne({
      where: { subscriber_id: subscriberId },
    });

    if (!tracking) return false;

    return tracking.window_expires_at > new Date();
  }

  async getPendingNotifications(
    subscriberId: string,
  ): Promise<PendingNotification[]> {
    return this.notificationRepo.find({
      where: {
        subscriber_id: subscriberId,
        status: 'pending',
      },
      order: { priority: 'ASC', created_at: 'ASC' },
    });
  }

  async queueNotification(input: QueueNotificationInput): Promise<void> {
    const notification = this.notificationRepo.create({
      subscriber_id: input.subscriberId,
      type: input.type,
      priority: input.priority,
      payload: input.payload,
      status: 'pending',
    });

    await this.notificationRepo.save(notification);

    this.logger.log(
      `Queued ${input.priority} notification ` + `for ${input.subscriberId}`,
    );
  }

  async markNotificationsSent(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.notificationRepo.update(ids, {
      status: 'sent',
      sent_at: new Date(),
    });
  }

  async drainPendingNotifications(
    subscriberId: string,
  ): Promise<PendingNotification[]> {
    const pending = await this.getPendingNotifications(subscriberId);

    if (pending.length === 0) return [];

    this.logger.log(
      `Draining ${pending.length} pending notifications ` +
        `for ${subscriberId}`,
    );

    return pending;
  }
}
