import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Tenant, TenantStatus } from '../../tenants/entities/tenant.entity';
import { AuditLog, AuditAction } from '../../audit/entities/audit-log.entity';
import { StripeService } from './stripe.service';
import { WebsocketsGateway } from '../../websockets/websockets.gateway';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private stripeService: StripeService,
    private configService: ConfigService,
    private websocketsGateway: WebsocketsGateway,
  ) {}

  // ==================== PLANS ====================
  async getPlans() {
    return this.planRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }

  // ==================== SUBSCRIPTION INFO ====================
  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, deletedAt: IsNull() },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('No tienes una suscripción activa');
    }

    return subscription;
  }

  async getSubscriptionWithLimits(tenantId: string) {
    const subscription = await this.getCurrentSubscription(tenantId);
    const plan = subscription.plan;

    // Calcular uso actual
    const usage = await this.calculateUsage(tenantId);

    return {
      subscription,
      plan,
      usage,
      limits: {
        maxUsers: plan.maxUsers,
        maxServices: plan.maxServices,
        maxBookingsPerMonth: plan.maxBookingsPerMonth,
      },
      features: plan.features || {},
    };
  }

  private async calculateUsage(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [userCount, serviceCount, bookingCount] = await Promise.all([
      this.subscriptionRepository.manager.query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [tenantId],
      ),
      this.subscriptionRepository.manager.query(
        `SELECT COUNT(*) FROM services WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [tenantId],
      ),
      this.subscriptionRepository.manager.query(
        `SELECT COUNT(*) FROM bookings WHERE tenant_id = $1 AND deleted_at IS NULL AND created_at >= $2`,
        [tenantId, startOfMonth],
      ),
    ]);

    return {
      users: parseInt(userCount[0]?.count || '0', 10),
      services: parseInt(serviceCount[0]?.count || '0', 10),
      bookingsThisMonth: parseInt(bookingCount[0]?.count || '0', 10),
    };
  }

  // ==================== PLAN LIMITS CHECK ====================
  async checkPlanLimit(
    tenantId: string,
    resource: 'users' | 'services' | 'bookings',
  ): Promise<{ allowed: boolean; current: number; limit: number; planName: string }> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const plan = subscription.plan;
    const usage = await this.calculateUsage(tenantId);

    let current: number;
    let limit: number;

    switch (resource) {
      case 'users':
        current = usage.users;
        limit = plan.maxUsers;
        break;
      case 'services':
        current = usage.services;
        limit = plan.maxServices;
        break;
      case 'bookings':
        current = usage.bookingsThisMonth;
        limit = plan.maxBookingsPerMonth;
        break;
    }

    // Si el límite es -1 o 0, significa ilimitado
    const allowed = limit <= 0 || current < limit;

    return {
      allowed,
      current,
      limit,
      planName: plan.name,
    };
  }

  // ==================== CHECKOUT ====================
  async createCheckoutSession(
    tenantId: string,
    planId: string,
    userId: string,
  ) {
    const plan = await this.getPlanById(planId);

    if (!plan.stripePriceId) {
      throw new BadRequestException('Este plan no está disponible para compra online');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const session = await this.stripeService.createCheckoutSession({
      customerEmail: undefined, // Se obtiene del usuario
      priceId: plan.stripePriceId,
      successUrl: `${frontendUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/dashboard/subscription/cancel`,
      metadata: {
        tenantId,
        planId,
        userId,
      },
    });

    // Auditar
    await this.createAuditLog(
      AuditAction.CREATE,
      'CheckoutSession',
      session.id,
      userId,
      tenantId,
      undefined,
      { planId, planName: plan.name },
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================
  async cancelSubscription(tenantId: string, userId: string, immediate = false) {
    const subscription = await this.getCurrentSubscription(tenantId);

    if (subscription.plan.name === 'FREE') {
      throw new BadRequestException('No puedes cancelar el plan gratuito');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Esta suscripción no tiene un ID de Stripe asociado');
    }

    // Cancelar en Stripe
    await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      !immediate, // cancelAtPeriodEnd
    );

    // Actualizar local
    subscription.cancelAtPeriodEnd = !immediate;
    if (immediate) {
      subscription.status = SubscriptionStatus.CANCELED;
    }
    await this.subscriptionRepository.save(subscription);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      userId,
      tenantId,
      { status: subscription.status },
      { action: 'cancel', immediate },
    );

    return {
      message: immediate
        ? 'Suscripción cancelada inmediatamente'
        : 'Tu suscripción se cancelará al final del período actual',
      subscription,
    };
  }

  async resumeSubscription(tenantId: string, userId: string) {
    const subscription = await this.getCurrentSubscription(tenantId);

    if (!subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('La suscripción no está marcada para cancelación');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Esta suscripción no tiene un ID de Stripe asociado');
    }

    // Reanudar en Stripe
    await this.stripeService.resumeSubscription(subscription.stripeSubscriptionId);

    // Actualizar local
    subscription.cancelAtPeriodEnd = false;
    await this.subscriptionRepository.save(subscription);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      userId,
      tenantId,
      { cancelAtPeriodEnd: true },
      { cancelAtPeriodEnd: false, action: 'resume' },
    );

    return {
      message: 'Suscripción reanudada correctamente',
      subscription,
    };
  }

  async changePlan(tenantId: string, newPlanId: string, userId: string) {
    const subscription = await this.getCurrentSubscription(tenantId);
    const newPlan = await this.getPlanById(newPlanId);

    if (!newPlan.stripePriceId) {
      throw new BadRequestException('Este plan no está disponible');
    }

    if (subscription.planId === newPlanId) {
      throw new BadRequestException('Ya estás en este plan');
    }

    // Si tiene suscripción en Stripe, actualizar
    if (subscription.stripeSubscriptionId) {
      await this.stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        newPlan.stripePriceId,
      );
    }

    const oldPlanId = subscription.planId;
    subscription.planId = newPlanId;
    await this.subscriptionRepository.save(subscription);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      userId,
      tenantId,
      { planId: oldPlanId },
      { planId: newPlanId, action: 'change_plan' },
    );

    return {
      message: `Plan actualizado a ${newPlan.name}`,
      subscription: await this.getCurrentSubscription(tenantId),
    };
  }

  // ==================== BILLING PORTAL ====================
  async createBillingPortalSession(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    
    if (!tenant?.stripeCustomerId) {
      throw new BadRequestException('No tienes un perfil de facturación configurado');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const session = await this.stripeService.createBillingPortalSession(
      tenant.stripeCustomerId,
      `${frontendUrl}/dashboard/subscription`,
    );

    return { url: session.url };
  }

  // ==================== PAYMENTS HISTORY ====================
  async getPaymentHistory(tenantId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, deletedAt: IsNull() },
    });

    if (!subscription) {
      return [];
    }

    return this.paymentRepository.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  // ==================== WEBHOOK HANDLERS ====================
  async handleCheckoutCompleted(session: any) {
    const { tenantId, planId, userId } = session.metadata;

    if (!tenantId || !planId) {
      this.logger.error('Checkout session sin metadata necesaria');
      return;
    }

    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      this.logger.error(`Plan no encontrado: ${planId}`);
      return;
    }

    // Obtener o crear suscripción
    let subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, deletedAt: IsNull() },
    });

    const stripeSubscription = session.subscription;

    if (subscription) {
      // Actualizar suscripción existente
      subscription.planId = planId;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.stripeSubscriptionId = stripeSubscription;
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      subscription.cancelAtPeriodEnd = false;
    } else {
      // Crear nueva suscripción
      subscription = this.subscriptionRepository.create({
        tenantId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: stripeSubscription,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    await this.subscriptionRepository.save(subscription);

    // Actualizar tenant con stripeCustomerId
    if (session.customer) {
      await this.tenantRepository.update(tenantId, {
        stripeCustomerId: session.customer,
        status: TenantStatus.ACTIVE,
      });
    }

    // Registrar pago
    const payment = this.paymentRepository.create({
      subscriptionId: subscription.id,
      amount: session.amount_total / 100,
      currency: session.currency?.toUpperCase() || 'USD',
      status: PaymentStatus.COMPLETED,
      stripePaymentIntentId: session.payment_intent,
      paidAt: new Date(),
    });
    await this.paymentRepository.save(payment);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      userId,
      tenantId,
      undefined,
      { action: 'checkout_completed', planName: plan.name },
    );

    // Emitir evento WebSocket de suscripción actualizada
    this.websocketsGateway.emitSubscriptionUpdated(tenantId, {
      id: subscription.id,
      status: subscription.status,
      planName: plan.name,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

    this.logger.log(`Checkout completado para tenant ${tenantId}, plan ${plan.name}`);
  }

  async handleInvoicePaymentFailed(invoice: any) {
    const subscriptionId = invoice.subscription;

    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      this.logger.warn(`Suscripción no encontrada: ${subscriptionId}`);
      return;
    }

    // Marcar como PAST_DUE
    subscription.status = SubscriptionStatus.PAST_DUE;
    await this.subscriptionRepository.save(subscription);

    // Registrar pago fallido
    const payment = this.paymentRepository.create({
      subscriptionId: subscription.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: PaymentStatus.FAILED,
      stripeInvoiceId: invoice.id,
    });
    await this.paymentRepository.save(payment);

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      undefined,
      subscription.tenantId,
      { status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.PAST_DUE, reason: 'payment_failed' },
    );

    this.logger.warn(`Pago fallido para suscripción ${subscription.id}`);

    // Emitir evento WebSocket de suscripción en problemas
    this.websocketsGateway.emitSubscriptionExpiring(subscription.tenantId, {
      subscriptionId: subscription.id,
      status: SubscriptionStatus.PAST_DUE,
      reason: 'payment_failed',
    });
  }

  async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(`Suscripción no encontrada: ${stripeSubscription.id}`);
      return;
    }

    // Marcar como cancelada
    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    // Degradar a plan FREE
    const freePlan = await this.planRepository.findOne({
      where: { name: 'FREE' },
    });

    if (freePlan) {
      // Crear nueva suscripción gratuita
      const freeSubscription = this.subscriptionRepository.create({
        tenantId: subscription.tenantId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subscriptionRepository.save(freeSubscription);
    }

    // Auditar
    await this.createAuditLog(
      AuditAction.UPDATE,
      'Subscription',
      subscription.id,
      undefined,
      subscription.tenantId,
      { status: subscription.status },
      { status: SubscriptionStatus.CANCELED, action: 'subscription_deleted' },
    );

    this.logger.log(`Suscripción cancelada: ${subscription.id}`);

    // Emitir evento WebSocket de suscripción expirada
    this.websocketsGateway.emitSubscriptionExpired(subscription.tenantId, {
      subscriptionId: subscription.id,
      status: SubscriptionStatus.CANCELED,
    });
  }

  async handleInvoicePaid(invoice: any) {
    const subscriptionId = invoice.subscription;

    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription) {
      return;
    }

    // Asegurar que está activa
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.subscriptionRepository.save(subscription);

    // Registrar pago
    const payment = this.paymentRepository.create({
      subscriptionId: subscription.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency?.toUpperCase() || 'USD',
      status: PaymentStatus.COMPLETED,
      stripeInvoiceId: invoice.id,
      paidAt: new Date(),
    });
    await this.paymentRepository.save(payment);

    this.logger.log(`Invoice pagada para suscripción ${subscription.id}`);
  }

  // ==================== HELPER: Crear suscripción FREE ====================
  async createFreeSubscription(tenantId: string) {
    const freePlan = await this.planRepository.findOne({
      where: { name: 'FREE' },
    });

    if (!freePlan) {
      throw new NotFoundException('Plan FREE no encontrado');
    }

    const subscription = this.subscriptionRepository.create({
      tenantId,
      planId: freePlan.id,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  // ==================== AUDIT ====================
  private async createAuditLog(
    action: AuditAction,
    entity: string,
    entityId: string,
    userId?: string,
    tenantId?: string,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      entity,
      entityId,
      userId,
      tenantId,
      oldValue,
      newValue,
    });
    await this.auditLogRepository.save(auditLog);
  }
}
