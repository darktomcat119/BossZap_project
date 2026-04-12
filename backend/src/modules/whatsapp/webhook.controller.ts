import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue/constants';
import {
  WebhookPayload,
  WebhookMessage,
  parseWebhookPayload,
} from './dto/webhook.types';

@ApiTags('WhatsApp Webhook')
@Controller('webhook/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_INBOUND)
    private readonly inboundQueue: Queue,
  ) {
    this.verifyToken = this.configService.get<string>(
      'WABA_VERIFY_TOKEN',
      'bosszap-verify-token',
    );
    this.appSecret = this.configService.get<string>(
      'WABA_APP_SECRET',
      '',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Meta webhook verification' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }
    this.logger.warn('Webhook verification failed');
    res.status(401).send('Invalid verify token');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: WebhookPayload,
    @Headers('x-hub-signature-256') signature: string,
  ): Promise<string> {
    if (this.appSecret && !this.verifySignature(req, signature)) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    const messages = parseWebhookPayload(body);

    for (const message of messages) {
      await this.enqueueMessage(message);
    }

    return 'OK';
  }

  private verifySignature(
    req: RawBodyRequest<Request>,
    signature: string,
  ): boolean {
    if (!signature || !req.rawBody) {
      return false;
    }

    const expectedSignature =
      'sha256=' +
      crypto
        .createHmac('sha256', this.appSecret)
        .update(req.rawBody)
        .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  private async enqueueMessage(
    message: WebhookMessage,
  ): Promise<void> {
    await this.inboundQueue.add(
      'process-message',
      message,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    this.logger.log(
      `Enqueued message from ${message.from} ` +
        `type=${message.type}`,
    );
  }
}
