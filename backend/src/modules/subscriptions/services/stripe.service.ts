import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY no configurada. Stripe deshabilitado.');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-12-15.clover',
    });
  }

  // ==================== CUSTOMERS ====================
  async createCustomer(email: string, name: string, metadata?: Record<string, string>) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer;
    } catch (error) {
      this.logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      this.logger.error('Error retrieving Stripe customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, data: Stripe.CustomerUpdateParams) {
    try {
      return await this.stripe.customers.update(customerId, data);
    } catch (error) {
      this.logger.error('Error updating Stripe customer:', error);
      throw error;
    }
  }

  // ==================== CHECKOUT SESSION ====================
  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialDays?: number;
  }) {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      };

      if (params.customerId) {
        sessionParams.customer = params.customerId;
      } else if (params.customerEmail) {
        sessionParams.customer_email = params.customerEmail;
      }

      if (params.trialDays) {
        sessionParams.subscription_data = {
          trial_period_days: params.trialDays,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async getCheckoutSession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });
    } catch (error) {
      this.logger.error('Error retrieving checkout session:', error);
      throw error;
    }
  }

  // ==================== SUBSCRIPTIONS ====================
  async getSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    try {
      if (cancelAtPeriodEnd) {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (error) {
      this.logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async resumeSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      this.logger.error('Error resuming subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, newPriceId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  // ==================== BILLING PORTAL ====================
  async createBillingPortalSession(customerId: string, returnUrl: string) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      this.logger.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  // ==================== WEBHOOKS ====================
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no configurado');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  // ==================== PRICES & PRODUCTS ====================
  async listPrices(productId?: string) {
    try {
      const params: Stripe.PriceListParams = {
        active: true,
        expand: ['data.product'],
      };

      if (productId) {
        params.product = productId;
      }

      return await this.stripe.prices.list(params);
    } catch (error) {
      this.logger.error('Error listing prices:', error);
      throw error;
    }
  }

  // ==================== INVOICES ====================
  async getInvoice(invoiceId: string) {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      this.logger.error('Error retrieving invoice:', error);
      throw error;
    }
  }

  async listInvoices(customerId: string, limit = 10) {
    try {
      return await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
    } catch (error) {
      this.logger.error('Error listing invoices:', error);
      throw error;
    }
  }
}
