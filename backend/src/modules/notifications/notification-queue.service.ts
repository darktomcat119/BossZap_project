import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PendingNotification,
} from '../../database/entities/pending-notification.entity';
import { WindowOptimizerService } from './window-optimizer.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

type Priority = 'P1' | 'P2' | 'P3';

interface CreateNotificationData {
  subscriberId: string;
  type: string;
  priority: Priority;
  payload: Record<string, unknown>;
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(
    NotificationQueueService.name,
  );

  constructor(
    @InjectRepository(PendingNotification)
    private readonly notificationRepo: Repository<PendingNotification>,
    private readonly windowOptimizer: WindowOptimizerService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async queueNotification(
    data: CreateNotificationData,
  ): Promise<PendingNotification> {
    const notification = this.notificationRepo.create({
      subscriber_id: data.subscriberId,
      type: data.type,
      priority: data.priority,
      payload: data.payload,
      status: 'pending',
    });

    const saved = await this.notificationRepo.save(notification);

    if (data.priority === 'P1') {
      await this.sendImmediately(saved);
    }

    return saved;
  }

  async sendPendingForSubscriber(
    subscriberId: string,
  ): Promise<number> {
    const isOpen = await this.windowOptimizer.isWindowOpen(
      subscriberId,
    );

    if (!isOpen) {
      return 0;
    }

    const pending = await this.notificationRepo.find({
      where: {
        subscriber_id: subscriberId,
        status: 'pending',
      },
      order: {
        priority: 'ASC',
        created_at: 'ASC',
      },
    });

    let sent = 0;

    for (const notification of pending) {
      const success = await this.sendNotification(
        notification,
        'free',
      );
      if (success) {
        sent++;
      }
    }

    this.logger.log(
      `Sent ${sent} pending notifications ` +
        `for subscriber ${subscriberId}`,
    );

    return sent;
  }

  async getPendingCount(subscriberId: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        subscriber_id: subscriberId,
        status: 'pending',
      },
    });
  }

  private async sendImmediately(
    notification: PendingNotification,
  ): Promise<void> {
    const isOpen = await this.windowOptimizer.isWindowOpen(
      notification.subscriber_id,
    );

    if (isOpen) {
      await this.sendNotification(notification, 'free');
    } else {
      await this.sendViaHsm(notification);
    }
  }

  private async sendNotification(
    notification: PendingNotification,
    costType: 'free' | 'hsm',
  ): Promise<boolean> {
    try {
      const message = this.formatNotificationMessage(
        notification,
      );

      await this.whatsappService.sendText({
        to: notification.subscriber_id,
        text: message,
        subscriberId: notification.subscriber_id,
      });

      await this.notificationRepo.update(notification.id, {
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(
        `Notification ${notification.id} sent ` +
          `(${costType}) type=${notification.type}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      await this.notificationRepo.update(notification.id, {
        status: 'failed',
      });

      return false;
    }
  }

  private async sendViaHsm(
    notification: PendingNotification,
  ): Promise<void> {
    try {
      await this.whatsappService.sendTemplate({
        to: notification.subscriber_id,
        templateName: notification.type,
        language: 'en',
        components: notification.payload?.components as Record<string, unknown>[] | undefined,
        subscriberId: notification.subscriber_id,
      });

      await this.notificationRepo.update(notification.id, {
        status: 'sent',
        sent_at: new Date(),
      });

      this.logger.log(
        `Notification ${notification.id} sent via HSM ` +
          `type=${notification.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send HSM notification ` +
          `${notification.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      await this.notificationRepo.update(notification.id, {
        status: 'failed',
      });
    }
  }

  private formatNotificationMessage(
    notification: PendingNotification,
  ): string {
    const payload = notification.payload as Record<
      string,
      string
    >;

    switch (notification.type) {
      case 'agenda_reminder':
        return (
          payload.message ||
          `Reminder: ${payload.title} at ${payload.time}`
        );
      case 'budget_ready':
        return (
          payload.message ||
          `Your budget is ready: ${payload.url}`
        );
      case 'payment_recovery':
        return payload.message || 'Payment reminder';
      default:
        return payload.message || notification.type;
    }
  }
}
