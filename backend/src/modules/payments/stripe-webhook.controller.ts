import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PaymentService } from './payment.service';

@ApiTags('Stripe Webhook')
@Controller('payments/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Stripe webhook: ${event.type} id=${event.id}`);

    this.processEventAsync(event).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing webhook event ${event.id}: ${message}`,
      );
    });

    return { received: true };
  }

  private async processEventAsync(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;

    const subscriberId = session.metadata?.subscriber_id;
    const planId = session.metadata?.plan_id;
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriberId || !stripeSubscriptionId) {
      this.logger.warn(
        'Checkout completed but missing metadata or subscription ID',
      );
      return;
    }

    const subscription = await this.findSubscriptionByCheckoutSession(
      session.id,
      subscriberId,
    );

    if (subscription) {
      await this.paymentService.updateSubscriptionGatewayId(
        subscription,
        stripeSubscriptionId,
      );
    }

    this.logger.log(
      `Checkout completed for subscriber=${subscriberId} ` +
        `plan=${planId} stripe_sub=${stripeSubscriptionId}`,
    );
  }

  private async handleInvoicePaymentSucceeded(
    event: Stripe.Event,
  ): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!subscriptionId) {
      this.logger.warn('Invoice payment succeeded but no subscription ID');
      return;
    }

    const amountPaid = (invoice.amount_paid || 0) / 100;

    await this.paymentService.handlePaymentSuccess(
      invoice.id,
      amountPaid,
      subscriptionId,
    );
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!subscriptionId) {
      this.logger.warn('Invoice payment failed but no subscription ID');
      return;
    }

    await this.paymentService.handlePaymentFailed(invoice.id, subscriptionId);
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    await this.paymentService.handleSubscriptionCancelled(subscription.id);
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    const currentPeriodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : null;
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await this.paymentService.handleSubscriptionUpdated(
      subscription.id,
      subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
    );
  }

  /**
   * When a checkout session completes, the local subscription record
   * still has the checkout session ID as payment_gateway_id.
   * We return sessionId so the caller can pass it to
   * updateSubscriptionGatewayId to replace it with the real
   * Stripe subscription ID.
   */
  private async findSubscriptionByCheckoutSession(
    sessionId: string,
    _subscriberId: string,
  ): Promise<string | null> {
    return sessionId;
  }
}
