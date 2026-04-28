import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { OrchestratorService } from '../../ai/orchestrator.service';
import { ConversationService } from '../../ai/conversation.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { MediaService } from '../../whatsapp/media.service';
import { WindowTrackerService } from '../../whatsapp/window-tracker.service';
import { SubscribersService } from '../../subscribers/subscribers.service';
import { WebhookMessage } from '../../whatsapp/dto/webhook.types';

@Processor(QUEUE_NAMES.WHATSAPP_INBOUND, {
  concurrency: 5,
})
export class InboundProcessor extends WorkerHost {
  private readonly logger = new Logger(InboundProcessor.name);

  constructor(
    private readonly orchestrator: OrchestratorService,
    private readonly conversation: ConversationService,
    private readonly whatsapp: WhatsappService,
    private readonly media: MediaService,
    private readonly windowTracker: WindowTrackerService,
    private readonly subscribers: SubscribersService,
  ) {
    super();
  }

  async process(job: Job<WebhookMessage>): Promise<void> {
    const message = job.data;
    this.logger.log(`Processing ${message.type} from ${message.from}`);

    try {
      const subscriberId = await this.resolveSubscriberId(message.from);

      await this.windowTracker.updateWindow(subscriberId);

      let textContent = message.text || '';

      if (message.type === 'audio' && message.mediaId) {
        textContent = await this.media.transcribeAudio(message.mediaId);
      }

      if (message.type === 'image' && message.mediaId) {
        const subscriber = await this.subscribers.findById(subscriberId);
        const expectingLogo =
          subscriber.status === 'onboarding' ||
          (await this.recentlyInvitedLogoUpload(subscriberId));

        if (expectingLogo) {
          try {
            const logoUrl = await this.media.processAndStoreImage(
              message.mediaId,
              subscriberId,
              'logo',
            );
            await this.subscribers.update(subscriberId, {
              logo_url: logoUrl,
            });
            textContent = '[Logo received and stored successfully]';
          } catch (err) {
            this.logger.warn(
              `Logo upload failed for ${subscriberId}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
            textContent = '[Image received but could not be stored]';
          }
        } else if (!textContent) {
          textContent = '[Image received]';
        }
      }

      if (!textContent && message.type === 'location') {
        const loc = message.location;
        textContent =
          `[Location: ${loc?.latitude}, ` +
          `${loc?.longitude}` +
          (loc?.name ? ` - ${loc.name}` : '') +
          ']';
      }

      const response = await this.orchestrator.processMessage({
        subscriberId,
        phone: message.from,
        text: textContent,
        messageType: message.type,
        mediaId: message.mediaId,
        contactName: message.contactName,
      });

      if (response.documentUrl) {
        await this.whatsapp.sendDocument({
          to: message.from,
          documentUrl: response.documentUrl,
          filename: response.documentFilename || 'document.pdf',
          caption: response.responseText,
          subscriberId,
        });
      } else if (response.mediaUrl) {
        await this.whatsapp.sendImage({
          to: message.from,
          imageUrl: response.mediaUrl,
          caption: response.responseText,
          subscriberId,
        });
      } else if (response.responseText) {
        await this.whatsapp.sendText({
          to: message.from,
          text: response.responseText,
          subscriberId,
          priority: 'P2',
        });
      }

      const pending =
        await this.windowTracker.drainPendingNotifications(subscriberId);
      const sentIds: string[] = [];

      for (const notification of pending) {
        const payload = notification.payload as Record<string, string>;
        if (payload.text) {
          await this.whatsapp.sendText({
            to: message.from,
            text: payload.text,
            subscriberId,
            priority: notification.priority as 'P1' | 'P2' | 'P3',
          });
        }
        sentIds.push(notification.id);
      }

      await this.windowTracker.markNotificationsSent(sentIds);

      this.logger.log(
        `Processed message from ${message.from}, ` +
          `intent: ${response.intent}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message from ${message.from}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * True if the AI assistant invited a logo upload in the last 10 minutes.
   * That signal lets us auto-treat the next inbound image as a logo,
   * without needing a new DB column or pending-state table.
   */
  private async recentlyInvitedLogoUpload(
    subscriberId: string,
  ): Promise<boolean> {
    const last = await this.conversation.getLastAssistantMessage(
      subscriberId,
      10,
    );
    return last?.intent === 'LOGO_UPLOAD_REQUEST';
  }

  private async resolveSubscriberId(phone: string): Promise<string> {
    const subscriber = await this.subscribers.findByPhone(phone);
    if (subscriber) return subscriber.id;

    const newSubscriber = await this.subscribers.create({
      phone,
      status: 'onboarding',
    });
    return newSubscriber.id;
  }
}
