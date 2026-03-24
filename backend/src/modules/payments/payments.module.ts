import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { RecoveryService } from './recovery.service';
import { PaymentController } from './payment.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, Subscriber]),
    WhatsappModule,
  ],
  controllers: [PaymentController, StripeWebhookController],
  providers: [PaymentService, StripeService, RecoveryService],
  exports: [PaymentService, RecoveryService],
})
export class PaymentsModule {}
