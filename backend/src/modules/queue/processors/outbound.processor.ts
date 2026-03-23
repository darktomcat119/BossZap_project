import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES, RETRY_DELAYS } from '../constants';
import { WhatsappService } from '../../whatsapp/whatsapp.service';

interface OutboundJobData {
  type: string;
  to: string;
  subscriberId: string;
  payload: Record<string, unknown>;
  windowOpen: boolean;
}

@Processor(QUEUE_NAMES.WHATSAPP_OUTBOUND, {
  concurrency: 10,
})
export class OutboundProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboundProcessor.name);

  constructor(
    private readonly whatsapp: WhatsappService,
  ) {
    super();
  }

  async process(job: Job<OutboundJobData>): Promise<void> {
    const { type, to, subscriberId, payload } = job.data;

    this.logger.log(
      `Sending ${type} to ${to} (sub: ${subscriberId})`,
    );

    try {
      await this.whatsapp.callMetaApi(payload);

      this.logger.log(
        `Message sent to ${to}, type: ${type}`,
      );
    } catch (error) {
      const attempt = job.attemptsMade;
      const msg = error instanceof Error
        ? error.message
        : String(error);

      if (msg.includes('429') || msg.includes('5')) {
        const delay = RETRY_DELAYS[attempt] || 60000;
        this.logger.warn(
          `Rate limited/server error sending to ${to}, ` +
            `retry ${attempt + 1} in ${delay}ms`,
        );
      }

      this.logger.error(
        `Failed to send ${type} to ${to}: ${msg}`,
      );
      throw error;
    }
  }
}
