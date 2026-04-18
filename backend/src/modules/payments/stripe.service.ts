import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

interface CheckoutSessionParams {
  subscriberId: string;
  planId: string;
  email: string;
  priceAmountCents: number;
  planName: string;
  trialDays: number;
  stripePriceId?: string | null;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

interface PortalSessionResult {
  url: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );
    this.successUrl = this.configService.get<string>(
      'STRIPE_SUCCESS_URL',
      'https://app.bosszap.com.br/payment/success?session_id={CHECKOUT_SESSION_ID}',
    );
    this.cancelUrl = this.configService.get<string>(
      'STRIPE_CANCEL_URL',
      'https://app.bosszap.com.br/payment/cancel',
    );

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    const {
      subscriberId,
      planId,
      email,
      priceAmountCents,
      planName,
      trialDays,
      stripePriceId,
    } = params;

    this.logger.log(
      `Creating checkout session for subscriber=${subscriberId} ` +
        `plan=${planId}`,
    );

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      stripePriceId
        ? [{ price: stripePriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: `BossZap - ${planName}`,
                  description: `Assinatura mensal BossZap ${planName}`,
                },
                unit_amount: priceAmountCents,
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ];

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          subscriber_id: subscriberId,
          plan_id: planId,
        },
      },
      metadata: {
        subscriber_id: subscriberId,
        plan_id: planId,
      },
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    this.logger.log(`Creating portal session for customer=${customerId}`);

    const returnUrl = this.configService.get<string>(
      'STRIPE_PORTAL_RETURN_URL',
      'https://app.bosszap.com.br/dashboard',
    );

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      this.webhookSecret,
    );
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async getCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return null;
    }

    return customers.data[0];
  }
}
