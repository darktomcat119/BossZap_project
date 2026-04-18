import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue/constants';
import { WindowTrackerService } from './window-tracker.service';

interface SendTextOptions {
  to: string;
  text: string;
  subscriberId: string;
  priority?: 'P1' | 'P2' | 'P3';
}

interface SendTemplateOptions {
  to: string;
  templateName: string;
  language: string;
  components?: Record<string, unknown>[];
  subscriberId: string;
}

interface SendDocumentOptions {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
  subscriberId: string;
}

interface SendImageOptions {
  to: string;
  imageUrl: string;
  caption?: string;
  subscriberId: string;
}

interface MetaApiResponse {
  messaging_product: string;
  contacts: Array<{ wa_id: string }>;
  messages: Array<{ id: string }>;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly windowTracker: WindowTrackerService,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_OUTBOUND)
    private readonly outboundQueue: Queue,
  ) {
    this.phoneNumberId = this.configService.get<string>(
      'WABA_PHONE_NUMBER_ID',
      '',
    );
    this.accessToken = this.configService.get<string>('WABA_ACCESS_TOKEN', '');
    this.apiUrl =
      `https://graph.facebook.com/v18.0/` + `${this.phoneNumberId}/messages`;
  }

  async sendText(options: SendTextOptions): Promise<void> {
    const { to, text, subscriberId, priority = 'P2' } = options;
    const windowOpen = await this.windowTracker.isWindowOpen(subscriberId);

    if (!windowOpen && priority !== 'P1') {
      await this.windowTracker.queueNotification({
        subscriberId,
        type: 'text_response',
        priority,
        payload: { to, text },
      });
      this.logger.log(
        `Window closed for ${subscriberId}, ` + `queued ${priority} message`,
      );
      return;
    }

    if (!windowOpen && priority === 'P1') {
      this.logger.warn(
        `Window closed for ${subscriberId}, ` +
          `P1 message requires HSM template`,
      );
      return;
    }

    await this.enqueueOutbound({
      type: 'text',
      to,
      subscriberId,
      payload: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: text },
      },
      windowOpen,
    });
  }

  async sendTemplate(options: SendTemplateOptions): Promise<void> {
    const { to, templateName, language, components, subscriberId } = options;

    await this.enqueueOutbound({
      type: 'template',
      to,
      subscriberId,
      payload: {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components || [],
        },
      },
      windowOpen: false,
    });
  }

  async sendImage(options: SendImageOptions): Promise<void> {
    const { to, imageUrl, caption, subscriberId } = options;
    const windowOpen = await this.windowTracker.isWindowOpen(subscriberId);

    if (!windowOpen) {
      await this.windowTracker.queueNotification({
        subscriberId,
        type: 'image',
        priority: 'P2',
        payload: { to, imageUrl, caption },
      });
      return;
    }

    await this.enqueueOutbound({
      type: 'image',
      to,
      subscriberId,
      payload: {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || '',
        },
      },
      windowOpen,
    });
  }

  async sendDocument(options: SendDocumentOptions): Promise<void> {
    const { to, documentUrl, filename, caption, subscriberId } = options;
    const windowOpen = await this.windowTracker.isWindowOpen(subscriberId);

    if (!windowOpen) {
      await this.windowTracker.queueNotification({
        subscriberId,
        type: 'document',
        priority: 'P2',
        payload: { to, documentUrl, filename, caption },
      });
      return;
    }

    await this.enqueueOutbound({
      type: 'document',
      to,
      subscriberId,
      payload: {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          link: documentUrl,
          filename,
          caption: caption || '',
        },
      },
      windowOpen,
    });
  }

  async callMetaApi(
    payload: Record<string, unknown>,
  ): Promise<MetaApiResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta API error ${response.status}: ${error}`);
    }

    return response.json() as Promise<MetaApiResponse>;
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get media URL: ${response.status}`);
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  async downloadMedia(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async enqueueOutbound(data: {
    type: string;
    to: string;
    subscriberId: string;
    payload: Record<string, unknown>;
    windowOpen: boolean;
  }): Promise<void> {
    await this.outboundQueue.add('send-message', data, {
      attempts: 4,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }
}
