import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionsService } from './services/subscriptions.service';
import { StripeService } from './services/stripe.service';
import { CreateCheckoutDto, CancelSubscriptionDto, ChangePlanDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuditInterceptor, Auditable } from '../audit';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('subscriptions')
@UseInterceptors(AuditInterceptor)
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
  ) { }

  // ==================== PLANS ====================
  @Get('plans')
  @Public()
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  // ==================== CURRENT SUBSCRIPTION ====================
  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrentSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getCurrentSubscription(user.tenantId);
  }

  @Get('current/details')
  @UseGuards(JwtAuthGuard)
  getSubscriptionWithLimits(@CurrentUser() user: any) {
    return this.subscriptionsService.getSubscriptionWithLimits(user.tenantId);
  }

  // ==================== CHECKOUT ====================
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @Auditable('subscription', 'CREATE_CHECKOUT')
  createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      user.tenantId,
      createCheckoutDto.planId,
      user.userId,
    );
  }

  // ==================== BILLING PORTAL ====================
  @Post('billing-portal')
  @UseGuards(JwtAuthGuard)
  @Auditable('subscription', 'ACCESS_BILLING_PORTAL')
  createBillingPortal(@CurrentUser() user: any) {
    return this.subscriptionsService.createBillingPortalSession(user.tenantId);
  }

  // ==================== MANAGE SUBSCRIPTION ====================
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @Auditable('subscription', 'CANCEL')
  cancelSubscription(
    @Body() cancelDto: CancelSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.cancelSubscription(
      user.tenantId,
      user.userId,
      cancelDto.immediate || false,
    );
  }

  @Post('resume')
  @UseGuards(JwtAuthGuard)
  @Auditable('subscription', 'RESUME')
  resumeSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.resumeSubscription(user.tenantId, user.userId);
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  @Auditable('subscription', 'CHANGE_PLAN')
  changePlan(
    @Body() changePlanDto: ChangePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.changePlan(
      user.tenantId,
      changePlanDto.planId,
      user.userId,
    );
  }

  // ==================== PAYMENT HISTORY ====================
  @Get('payments')
  @UseGuards(JwtAuthGuard)
  getPaymentHistory(@CurrentUser() user: any) {
    return this.subscriptionsService.getPaymentHistory(user.tenantId);
  }

  // ==================== STRIPE WEBHOOKS ====================
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.error('No raw body in webhook request');
      return { received: false };
    }

    try {
      const event = this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );

      this.logger.log(`Webhook recibido: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.subscriptionsService.handleCheckoutCompleted(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.subscriptionsService.handleInvoicePaymentFailed(event.data.object);
          break;

        case 'invoice.paid':
          await this.subscriptionsService.handleInvoicePaid(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.subscriptionsService.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          this.logger.log(`Evento no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error procesando webhook:', error);
      return { received: false, error: error.message };
    }
  }
}
