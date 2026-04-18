import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { Plan } from '../../database/entities/plan.entity';
import { StripeService } from './stripe.service';

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RevenueReport {
  totalRevenue: string;
  paymentCount: number;
  startDate: Date;
  endDate: Date;
}

export interface SubscriptionWithPlan {
  subscription: Subscription;
  plan: Plan;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(
    subscriberId: string,
    planId: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${subscriberId} not found`);
    }

    const plan = await this.subscriptionRepo.manager
      .getRepository(Plan)
      .findOne({ where: { id: planId, is_active: true } });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found or not active`);
    }

    const existingActive = await this.subscriptionRepo.findOne({
      where: {
        subscriber_id: subscriberId,
        status: 'active',
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'Subscriber already has an active subscription',
      );
    }

    const priceAmountCents = Math.round(Number(plan.price_monthly) * 100);

    const { sessionId, url } = await this.stripeService.createCheckoutSession({
      subscriberId,
      planId,
      email: subscriber.email || '',
      priceAmountCents,
      planName: plan.name,
      trialDays: plan.trial_days,
      stripePriceId: plan.stripe_price_id,
    });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trial_days);

    const subscription = this.subscriptionRepo.create({
      subscriber_id: subscriberId,
      plan_id: planId,
      status: 'trialing',
      payment_gateway_id: sessionId,
      trial_ends_at: trialEndsAt,
    });

    await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Created subscription ${subscription.id} ` +
        `for subscriber=${subscriberId} plan=${planId} ` +
        `trial_ends_at=${trialEndsAt.toISOString()}`,
    );

    return { checkoutUrl: url, sessionId };
  }

  async getSubscription(
    subscriberId: string,
  ): Promise<SubscriptionWithPlan | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { subscriber_id: subscriberId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      return null;
    }

    return {
      subscription,
      plan: subscription.plan,
    };
  }

  async getPaymentHistory(
    subscriberId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedPayments> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { subscriber_id: subscriberId },
      select: ['id'],
    });

    if (subscriptions.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const subscriptionIds = subscriptions.map((s) => s.id);
    const skip = (page - 1) * limit;

    const [data, total] = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.subscription_id IN (:...subscriptionIds)', {
        subscriptionIds,
      })
      .orderBy('payment.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async handlePaymentSuccess(
    gatewayPaymentId: string,
    amount: number,
    subscriptionGatewayId: string,
  ): Promise<void> {
    this.logger.log(
      `Payment succeeded: gateway_payment_id=${gatewayPaymentId} ` +
        `amount=${amount}`,
    );

    const subscription = await this.findSubscriptionByGatewayId(
      subscriptionGatewayId,
    );

    if (!subscription) {
      this.logger.warn(
        `No subscription found for gateway_id=${subscriptionGatewayId}`,
      );
      return;
    }

    const existingPayment = await this.paymentRepo.findOne({
      where: { gateway_payment_id: gatewayPaymentId },
    });

    if (existingPayment) {
      this.logger.warn(`Duplicate payment event: ${gatewayPaymentId}`);
      return;
    }

    const payment = this.paymentRepo.create({
      subscription_id: subscription.id,
      amount,
      status: 'succeeded',
      payment_method: 'card',
      gateway_payment_id: gatewayPaymentId,
      paid_at: new Date(),
    });

    await this.paymentRepo.save(payment);

    subscription.status = 'active';
    subscription.current_period_start = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    subscription.current_period_end = periodEnd;
    await this.subscriptionRepo.save(subscription);

    await this.subscriberRepo.update(
      { id: subscription.subscriber_id },
      { status: 'active' },
    );

    this.logger.log(
      `Subscription ${subscription.id} activated ` +
        `for subscriber=${subscription.subscriber_id}`,
    );
  }

  async handlePaymentFailed(
    gatewayPaymentId: string,
    subscriptionGatewayId: string,
  ): Promise<void> {
    this.logger.warn(`Payment failed: gateway_payment_id=${gatewayPaymentId}`);

    const subscription = await this.findSubscriptionByGatewayId(
      subscriptionGatewayId,
    );

    if (!subscription) {
      this.logger.warn(
        `No subscription found for gateway_id=${subscriptionGatewayId}`,
      );
      return;
    }

    const existingPayment = await this.paymentRepo.findOne({
      where: { gateway_payment_id: gatewayPaymentId },
    });

    if (existingPayment) {
      this.logger.warn(`Duplicate failed payment event: ${gatewayPaymentId}`);
      return;
    }

    const payment = this.paymentRepo.create({
      subscription_id: subscription.id,
      amount: 0,
      status: 'failed',
      payment_method: 'card',
      gateway_payment_id: gatewayPaymentId,
    });

    await this.paymentRepo.save(payment);

    this.logger.log(
      `Recorded failed payment for subscription=${subscription.id}. ` +
        `Grace period logic will be handled by RecoveryService.`,
    );
  }

  async handleSubscriptionCancelled(gatewayId: string): Promise<void> {
    this.logger.log(`Subscription cancelled: gateway_id=${gatewayId}`);

    const subscription = await this.findSubscriptionByGatewayId(gatewayId);

    if (!subscription) {
      this.logger.warn(`No subscription found for gateway_id=${gatewayId}`);
      return;
    }

    subscription.status = 'cancelled';
    await this.subscriptionRepo.save(subscription);

    await this.subscriberRepo.update(
      { id: subscription.subscriber_id },
      { status: 'cancelled' },
    );

    this.logger.log(`Subscriber ${subscription.subscriber_id} cancelled`);
  }

  async handleSubscriptionUpdated(
    gatewayId: string,
    status: string,
    currentPeriodStart: Date | null,
    currentPeriodEnd: Date | null,
  ): Promise<void> {
    const subscription = await this.findSubscriptionByGatewayId(gatewayId);

    if (!subscription) {
      this.logger.warn(`No subscription found for gateway_id=${gatewayId}`);
      return;
    }

    if (status === 'active' || status === 'trialing') {
      subscription.status = status;
    } else if (status === 'past_due') {
      subscription.status = 'past_due';
      this.logger.warn(`Subscription ${subscription.id} moved to past_due`);
    } else if (status === 'canceled' || status === 'unpaid') {
      subscription.status = 'cancelled';
      this.logger.warn(`Subscription ${subscription.id} moved to ${status}`);
    }

    if (currentPeriodStart) {
      subscription.current_period_start = currentPeriodStart;
    }
    if (currentPeriodEnd) {
      subscription.current_period_end = currentPeriodEnd;
    }

    await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Subscription ${subscription.id} updated: status=${status}`,
    );
  }

  async suspendSubscriber(subscriberId: string): Promise<void> {
    this.logger.warn(`Suspending subscriber=${subscriberId}`);

    await this.subscriberRepo.update(
      { id: subscriberId },
      { status: 'suspended' },
    );

    const activeSubscription = await this.subscriptionRepo.findOne({
      where: { subscriber_id: subscriberId, status: 'active' },
    });

    if (activeSubscription) {
      activeSubscription.status = 'past_due';
      await this.subscriptionRepo.save(activeSubscription);
    }
  }

  async getRevenueReport(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueReport> {
    const result = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalRevenue')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .where('payment.status = :status', { status: 'succeeded' })
      .andWhere('payment.paid_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<{
        totalRevenue: string | null;
        paymentCount: string;
      }>();

    return {
      totalRevenue: result?.totalRevenue || '0.00',
      paymentCount: parseInt(result?.paymentCount || '0', 10),
      startDate,
      endDate,
    };
  }

  async getFailedPayments(): Promise<Payment[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.paymentRepo.find({
      where: {
        status: 'failed',
        created_at: Between(thirtyDaysAgo, new Date()),
      },
      relations: ['subscription'],
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async updateSubscriptionGatewayId(
    currentGatewayId: string,
    newGatewayId: string,
  ): Promise<void> {
    await this.subscriptionRepo.update(
      { payment_gateway_id: currentGatewayId },
      { payment_gateway_id: newGatewayId },
    );
  }

  private async findSubscriptionByGatewayId(
    gatewayId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { payment_gateway_id: gatewayId },
    });
  }
}
