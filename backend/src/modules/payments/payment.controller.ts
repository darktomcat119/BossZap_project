import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

interface JwtPayload {
  sub: string;
  email: string;
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create-checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckout(
    @Req() req: Request,
    @Body() dto: CreateCheckoutDto,
  ) {
    const user = req.user as JwtPayload;
    const result = await this.paymentService.createSubscription(
      user.sub,
      dto.plan_id,
    );

    return {
      checkout_url: result.checkoutUrl,
      session_id: result.sessionId,
    };
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const result = await this.paymentService.getSubscription(
      user.sub,
    );

    if (!result) {
      throw new NotFoundException('No subscription found');
    }

    return result;
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  async getPaymentHistory(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as JwtPayload;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10)),
    );

    return this.paymentService.getPaymentHistory(
      user.sub,
      pageNum,
      limitNum,
    );
  }

  @Post('portal')
  @ApiOperation({
    summary: 'Create Stripe customer portal session',
  })
  async createPortalSession(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const email = user.email;

    const customer =
      await this.stripeService.getCustomerByEmail(email);

    if (!customer) {
      throw new NotFoundException(
        'No Stripe customer found for this account',
      );
    }

    const session = await this.stripeService.createPortalSession(
      customer.id,
    );

    return { portal_url: session.url };
  }
}
