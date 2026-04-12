import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../../database/entities/payment.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { WindowTrackerService } from '../whatsapp/window-tracker.service';
import { PaymentService } from './payment.service';

type SupportedLanguage = 'es' | 'en' | 'pt-BR';

interface RecoveryMessage {
  text: string;
  templateName: string;
}

interface RecoveryStatus {
  subscriberId: string;
  daysSinceFailure: number;
  recoveryDay: 0 | 2 | 3 | null;
  isSuspended: boolean;
  lastFailedPaymentAt: Date | null;
}

const RECOVERY_MESSAGES: Record<
  SupportedLanguage,
  Record<'day0' | 'day2' | 'day3', RecoveryMessage>
> = {
  es: {
    day0: {
      text: 'Hola, {{name}}. Notamos que hubo un problema al procesar tu pago de BossZap. '
        + 'No te preocupes, esto puede pasar por varias razones. '
        + 'Puedes actualizar tu metodo de pago aqui: {{link}} '
        + 'Si necesitas ayuda, estamos para ti.',
      templateName: 'payment_recovery_day0_es',
    },
    day2: {
      text: 'Hola, {{name}}. Queremos recordarte que tu pago de BossZap aun esta pendiente. '
        + 'Para seguir disfrutando de todos los beneficios, por favor actualiza tu pago: {{link}} '
        + 'Estamos aqui para ayudarte con cualquier duda.',
      templateName: 'payment_recovery_day2_es',
    },
    day3: {
      text: 'Hola, {{name}}. Lamentablemente, no hemos podido procesar tu pago de BossZap. '
        + 'Tu acceso sera pausado temporalmente hoy. '
        + 'Puedes reactivar tu cuenta en cualquier momento actualizando tu pago: {{link}} '
        + 'Esperamos verte de vuelta pronto.',
      templateName: 'payment_recovery_day3_es',
    },
  },
  en: {
    day0: {
      text: 'Hi {{name}}, we noticed there was an issue processing your BossZap payment. '
        + "Don't worry, this can happen for various reasons. "
        + 'You can update your payment method here: {{link}} '
        + "If you need help, we're here for you.",
      templateName: 'payment_recovery_day0_en',
    },
    day2: {
      text: 'Hi {{name}}, just a friendly reminder that your BossZap payment is still pending. '
        + 'To keep enjoying all features, please update your payment: {{link}} '
        + "We're happy to help with any questions.",
      templateName: 'payment_recovery_day2_en',
    },
    day3: {
      text: 'Hi {{name}}, unfortunately we were unable to process your BossZap payment. '
        + 'Your access will be temporarily paused today. '
        + 'You can reactivate your account anytime by updating your payment: {{link}} '
        + 'We hope to see you back soon.',
      templateName: 'payment_recovery_day3_en',
    },
  },
  'pt-BR': {
    day0: {
      text: 'Oi {{name}}, notamos que houve um problema ao processar seu pagamento do BossZap. '
        + 'Nao se preocupe, isso pode acontecer por varios motivos. '
        + 'Voce pode atualizar seu metodo de pagamento aqui: {{link}} '
        + 'Se precisar de ajuda, estamos aqui para voce.',
      templateName: 'payment_recovery_day0_pt',
    },
    day2: {
      text: 'Oi {{name}}, queremos lembrar que seu pagamento do BossZap ainda esta pendente. '
        + 'Para continuar aproveitando todos os recursos, atualize seu pagamento: {{link}} '
        + 'Estamos a disposicao para qualquer duvida.',
      templateName: 'payment_recovery_day2_pt',
    },
    day3: {
      text: 'Oi {{name}}, infelizmente nao conseguimos processar seu pagamento do BossZap. '
        + 'Seu acesso sera pausado temporariamente hoje. '
        + 'Voce pode reativar sua conta a qualquer momento atualizando seu pagamento: {{link}} '
        + 'Esperamos te ver de volta em breve.',
      templateName: 'payment_recovery_day3_pt',
    },
  },
};

@Injectable()
export class RecoveryService {
  private readonly logger = new Logger(RecoveryService.name);
  private readonly paymentLink: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    private readonly whatsappService: WhatsappService,
    private readonly windowTracker: WindowTrackerService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {
    this.paymentLink = this.configService.get<string>(
      'PAYMENT_RECOVERY_LINK',
      'https://app.bosszap.com.br/payment/update',
    );
  }

  async checkAndSendRecovery(): Promise<void> {
    this.logger.log('Starting payment recovery check...');

    const failedPayments = await this.getUnresolvedFailedPayments();

    for (const failedPayment of failedPayments) {
      try {
        await this.processRecoveryForPayment(failedPayment);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Recovery failed for payment=${failedPayment.id}: ${message}`,
        );
      }
    }

    this.logger.log(
      `Recovery check complete. Processed ${failedPayments.length} failed payments.`,
    );
  }

  async getRecoveryStatus(
    subscriberId: string,
  ): Promise<RecoveryStatus> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      return {
        subscriberId,
        daysSinceFailure: 0,
        recoveryDay: null,
        isSuspended: false,
        lastFailedPaymentAt: null,
      };
    }

    const lastFailedPayment = await this.getLastFailedPayment(
      subscriberId,
    );

    if (!lastFailedPayment) {
      return {
        subscriberId,
        daysSinceFailure: 0,
        recoveryDay: null,
        isSuspended: subscriber.status === 'suspended',
        lastFailedPaymentAt: null,
      };
    }

    const daysSinceFailure = this.getDaysSinceDate(
      lastFailedPayment.created_at,
    );

    let recoveryDay: 0 | 2 | 3 | null = null;
    if (daysSinceFailure >= 3) {
      recoveryDay = 3;
    } else if (daysSinceFailure >= 2) {
      recoveryDay = 2;
    } else {
      recoveryDay = 0;
    }

    return {
      subscriberId,
      daysSinceFailure,
      recoveryDay,
      isSuspended: subscriber.status === 'suspended',
      lastFailedPaymentAt: lastFailedPayment.created_at,
    };
  }

  private async processRecoveryForPayment(
    failedPayment: Payment,
  ): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: failedPayment.subscription_id },
    });

    if (!subscription) {
      return;
    }

    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscription.subscriber_id },
    });

    if (!subscriber) {
      return;
    }

    if (subscriber.status === 'cancelled') {
      return;
    }

    const hasSucceeded = await this.hasSuccessfulPaymentSince(
      failedPayment.subscription_id,
      failedPayment.created_at,
    );

    if (hasSucceeded) {
      return;
    }

    const daysSinceFailure = this.getDaysSinceDate(
      failedPayment.created_at,
    );

    if (daysSinceFailure >= 3 && subscriber.status !== 'suspended') {
      await this.sendRecoveryMessage(subscriber, 'day3');
      await this.paymentService.suspendSubscriber(subscriber.id);
      this.logger.warn(
        `Subscriber ${subscriber.id} suspended after 3-day grace period`,
      );
      return;
    }

    if (daysSinceFailure >= 2 && daysSinceFailure < 3) {
      await this.sendRecoveryMessage(subscriber, 'day2');
      return;
    }

    if (daysSinceFailure < 2) {
      await this.sendRecoveryMessage(subscriber, 'day0');
    }
  }

  private async sendRecoveryMessage(
    subscriber: Subscriber,
    day: 'day0' | 'day2' | 'day3',
  ): Promise<void> {
    const language = this.resolveLanguage(
      subscriber.preferred_language,
    );
    const messageTemplate = RECOVERY_MESSAGES[language][day];
    const name = subscriber.owner_name || subscriber.business_name || '';
    const link = `${this.paymentLink}?sid=${subscriber.id}`;

    const text = messageTemplate.text
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{link\}\}/g, link);

    const windowOpen = await this.windowTracker.isWindowOpen(
      subscriber.id,
    );

    if (windowOpen) {
      await this.whatsappService.sendText({
        to: subscriber.phone,
        text,
        subscriberId: subscriber.id,
        priority: 'P1',
      });

      this.logger.log(
        `Sent ${day} recovery message (regular) ` +
          `to subscriber=${subscriber.id}`,
      );
    } else {
      const templateLangCode =
        language === 'pt-BR' ? 'pt_BR' : language;

      await this.whatsappService.sendTemplate({
        to: subscriber.phone,
        templateName: messageTemplate.templateName,
        language: templateLangCode,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: link },
            ],
          },
        ],
        subscriberId: subscriber.id,
      });

      this.logger.log(
        `Sent ${day} recovery message (HSM template) ` +
          `to subscriber=${subscriber.id}`,
      );
    }
  }

  private async getUnresolvedFailedPayments(): Promise<Payment[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 4);

    return this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.status = :status', { status: 'failed' })
      .andWhere('payment.created_at >= :since', {
        since: threeDaysAgo,
      })
      .orderBy('payment.created_at', 'ASC')
      .getMany();
  }

  private async getLastFailedPayment(
    subscriberId: string,
  ): Promise<Payment | null> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { subscriber_id: subscriberId },
      select: ['id'],
    });

    if (subscriptions.length === 0) {
      return null;
    }

    const subscriptionIds = subscriptions.map((s) => s.id);

    return this.paymentRepo
      .createQueryBuilder('payment')
      .where(
        'payment.subscription_id IN (:...subscriptionIds)',
        { subscriptionIds },
      )
      .andWhere('payment.status = :status', { status: 'failed' })
      .orderBy('payment.created_at', 'DESC')
      .getOne();
  }

  private async hasSuccessfulPaymentSince(
    subscriptionId: string,
    since: Date,
  ): Promise<boolean> {
    const count = await this.paymentRepo.count({
      where: {
        subscription_id: subscriptionId,
        status: 'succeeded',
        created_at: Between(since, new Date()),
      },
    });

    return count > 0;
  }

  private getDaysSinceDate(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private resolveLanguage(lang: string): SupportedLanguage {
    if (lang === 'en' || lang === 'es' || lang === 'pt-BR') {
      return lang;
    }
    if (lang.startsWith('pt')) {
      return 'pt-BR';
    }
    return 'es';
  }
}
